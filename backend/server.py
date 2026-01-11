from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    date: str
    type: Literal["entrada", "saida"]
    category: str
    description: str
    has_reminder: bool = False
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    amount: float
    date: str
    type: Literal["entrada", "saida"]
    category: str
    description: str
    has_reminder: bool = False

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[str] = None
    type: Optional[Literal["entrada", "saida"]] = None
    category: Optional[str] = None
    description: Optional[str] = None
    has_reminder: Optional[bool] = None

class PeriodStats(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    transactions: List[Transaction]

class TipsRequest(BaseModel):
    period: Literal["week", "month", "year"]

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    limit: float
    period: Literal["month", "year"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BudgetCreate(BaseModel):
    category: str
    limit: float
    period: Literal["month", "year"] = "month"

class CategoryStats(BaseModel):
    category: str
    total: float
    percentage: float
    budget_limit: Optional[float] = None
    remaining: Optional[float] = None

class PeriodComparison(BaseModel):
    current_period: PeriodStats
    previous_period: PeriodStats
    income_change: float
    expense_change: float
    balance_change: float

@api_router.get("/")
async def root():
    return {"message": "Meu Fluxo API"}

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    transaction_obj = Transaction(**input.model_dump())
    doc = transaction_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transactions.insert_one(doc)
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if isinstance(transaction['created_at'], str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    existing = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return {"message": "Transação deletada com sucesso"}

@api_router.get("/stats/week", response_model=PeriodStats)
async def get_week_stats():
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    week_transactions = []
    
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date >= week_start:
            week_transactions.append(Transaction(**t))
    
    total_income = sum(t.amount for t in week_transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in week_transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=week_transactions
    )

@api_router.get("/stats/month", response_model=PeriodStats)
async def get_month_stats():
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    month_transactions = []
    
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date >= month_start:
            month_transactions.append(Transaction(**t))
    
    total_income = sum(t.amount for t in month_transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in month_transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=month_transactions
    )

@api_router.get("/stats/year", response_model=PeriodStats)
async def get_year_stats():
    now = datetime.now(timezone.utc)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    year_transactions = []
    
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date >= year_start:
            year_transactions.append(Transaction(**t))
    
    total_income = sum(t.amount for t in year_transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in year_transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=year_transactions
    )

@api_router.post("/tips")
async def generate_tips(request: TipsRequest):
    stats_endpoint = f"/stats/{request.period}"
    
    if request.period == "week":
        stats = await get_week_stats()
    elif request.period == "month":
        stats = await get_month_stats()
    else:
        stats = await get_year_stats()
    
    categories_expense = {}
    for t in stats.transactions:
        if t.type == "saida":
            if t.category not in categories_expense:
                categories_expense[t.category] = 0
            categories_expense[t.category] += t.amount
    
    prompt = f"""Você é um assistente financeiro. Analise os seguintes dados financeiros e gere 3 dicas práticas e personalizadas em português:

Período: {request.period}
Receitas totais: R$ {stats.total_income:.2f}
Despesas totais: R$ {stats.total_expense:.2f}
Saldo: R$ {stats.balance:.2f}
Despesas por categoria: {categories_expense}

Gere 3 dicas curtas e objetivas (máximo 2 linhas cada) para ajudar a pessoa a gerenciar melhor suas finanças."""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"tips-{uuid.uuid4()}",
            system_message="Você é um consultor financeiro experiente e amigável."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"tips": response, "stats": stats.model_dump()}
    except Exception as e:
        logger.error(f"Erro ao gerar dicas: {str(e)}")
        return {
            "tips": "Não foi possível gerar dicas no momento. Tente novamente mais tarde.",
            "stats": stats.model_dump()
        }

@api_router.post("/send-reminder")
async def send_reminder(request: EmailRequest):
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": request.subject,
        "html": request.html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"Lembrete enviado para {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Falha ao enviar e-mail: {str(e)}")

@api_router.get("/reminders")
async def get_pending_reminders():
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    
    transactions = await db.transactions.find(
        {"has_reminder": True, "reminder_sent": False},
        {"_id": 0}
    ).to_list(1000)
    
    pending = []
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date <= tomorrow:
            pending.append(Transaction(**t))
    
    return pending

@api_router.post("/budgets", response_model=Budget)
async def create_budget(input: BudgetCreate):
    budget_obj = Budget(**input.model_dump())
    doc = budget_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.budgets.insert_one(doc)
    return budget_obj

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets():
    budgets = await db.budgets.find({}, {"_id": 0}).to_list(1000)
    for b in budgets:
        if isinstance(b['created_at'], str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return budgets

@api_router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, limit: float):
    existing = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    await db.budgets.update_one({"id": budget_id}, {"$set": {"limit": limit}})
    updated = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    result = await db.budgets.delete_one({"id": budget_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return {"message": "Orçamento deletado com sucesso"}

@api_router.get("/categories/stats")
async def get_categories_stats():
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    budgets = await db.budgets.find({"period": "month"}, {"_id": 0}).to_list(1000)
    
    budgets_map = {b['category']: b['limit'] for b in budgets}
    
    category_totals = {}
    total_expenses = 0
    
    for t in transactions:
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date >= month_start and t['type'] == "saida":
            if t['category'] not in category_totals:
                category_totals[t['category']] = 0
            category_totals[t['category']] += t['amount']
            total_expenses += t['amount']
    
    stats = []
    for category, total in category_totals.items():
        percentage = (total / total_expenses * 100) if total_expenses > 0 else 0
        budget_limit = budgets_map.get(category)
        remaining = (budget_limit - total) if budget_limit else None
        
        stats.append(CategoryStats(
            category=category,
            total=total,
            percentage=percentage,
            budget_limit=budget_limit,
            remaining=remaining
        ))
    
    stats.sort(key=lambda x: x.total, reverse=True)
    return stats

@api_router.get("/stats/comparison")
async def get_period_comparison():
    now = datetime.now(timezone.utc)
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if now.month == 1:
        previous_month_start = current_month_start.replace(year=now.year - 1, month=12)
    else:
        previous_month_start = current_month_start.replace(month=now.month - 1)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
    
    current_transactions = []
    previous_transactions = []
    
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        
        if trans_date >= current_month_start:
            current_transactions.append(Transaction(**t))
        elif trans_date >= previous_month_start and trans_date < current_month_start:
            previous_transactions.append(Transaction(**t))
    
    current_income = sum(t.amount for t in current_transactions if t.type == "entrada")
    current_expense = sum(t.amount for t in current_transactions if t.type == "saida")
    
    previous_income = sum(t.amount for t in previous_transactions if t.type == "entrada")
    previous_expense = sum(t.amount for t in previous_transactions if t.type == "saida")
    
    current_stats = PeriodStats(
        total_income=current_income,
        total_expense=current_expense,
        balance=current_income - current_expense,
        transactions=current_transactions
    )
    
    previous_stats = PeriodStats(
        total_income=previous_income,
        total_expense=previous_expense,
        balance=previous_income - previous_expense,
        transactions=previous_transactions
    )
    
    income_change = ((current_income - previous_income) / previous_income * 100) if previous_income > 0 else 0
    expense_change = ((current_expense - previous_expense) / previous_expense * 100) if previous_expense > 0 else 0
    balance_change = current_stats.balance - previous_stats.balance
    
    return PeriodComparison(
        current_period=current_stats,
        previous_period=previous_stats,
        income_change=income_change,
        expense_change=expense_change,
        balance_change=balance_change
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
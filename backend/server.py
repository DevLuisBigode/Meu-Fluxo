from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET', 'meu-fluxo-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    date: str
    type: Literal["entrada", "saida"]
    category: str
    description: str
    has_reminder: bool = False
    reminder_sent: bool = False
    recurring_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecurringTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    type: Literal["entrada", "saida"]
    category: str
    description: str
    frequency: Literal["daily", "weekly", "monthly", "yearly"]
    weekdays: Optional[List[int]] = None
    day_of_month: Optional[int] = None
    start_date: str
    end_date: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    amount: float
    date: str
    type: Literal["entrada", "saida"]
    category: str
    description: str
    has_reminder: bool = False
    is_recurring: bool = False
    recurring_frequency: Optional[Literal["daily", "weekly", "monthly", "yearly"]] = None
    recurring_weekdays: Optional[List[int]] = None
    recurring_day_of_month: Optional[int] = None
    recurring_end_date: Optional[str] = None

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
    user_id: str
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

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

@api_router.post("/auth/register", response_model=LoginResponse)
async def register(input: UserRegister):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_obj = User(
        email=input.email,
        name=input.name,
        password_hash=hash_password(input.password)
    )
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_token(user_obj.id)
    return LoginResponse(
        token=token,
        user=UserResponse(id=user_obj.id, email=user_obj.email, name=user_obj.name)
    )

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(input: UserLogin):
    user = await db.users.find_one({"email": input.email}, {"_id": 0})
    if not user or not verify_password(input.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_token(user['id'])
    return LoginResponse(
        token=token,
        user=UserResponse(id=user['id'], email=user['email'], name=user['name'])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return UserResponse(id=user['id'], email=user['email'], name=user['name'])

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate, user_id: str = Depends(get_current_user)):
    if input.is_recurring:
        recurring_obj = RecurringTransaction(
            user_id=user_id,
            amount=input.amount,
            type=input.type,
            category=input.category,
            description=input.description,
            frequency=input.recurring_frequency,
            weekdays=input.recurring_weekdays,
            day_of_month=input.recurring_day_of_month,
            start_date=input.date,
            end_date=input.recurring_end_date
        )
        recurring_doc = recurring_obj.model_dump()
        recurring_doc['created_at'] = recurring_doc['created_at'].isoformat()
        await db.recurring_transactions.insert_one(recurring_doc)
        
        transaction_obj = Transaction(
            user_id=user_id,
            amount=input.amount,
            date=input.date,
            type=input.type,
            category=input.category,
            description=f"{input.description} (Recorrente)",
            has_reminder=input.has_reminder,
            recurring_id=recurring_obj.id
        )
    else:
        transaction_obj = Transaction(
            user_id=user_id,
            amount=input.amount,
            date=input.date,
            type=input.type,
            category=input.category,
            description=input.description,
            has_reminder=input.has_reminder
        )
    
    doc = transaction_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transactions.insert_one(doc)
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    
    transactions.sort(key=lambda x: datetime.fromisoformat(x['date']), reverse=True)
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if isinstance(transaction['created_at'], str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate, user_id: str = Depends(get_current_user)):
    existing = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
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
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    result = await db.transactions.delete_one({"id": transaction_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return {"message": "Transação deletada com sucesso"}

async def get_period_transactions(user_id: str, start_date: datetime):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    period_transactions = []
    
    for t in transactions:
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
        trans_date = datetime.fromisoformat(t['date']).replace(tzinfo=timezone.utc)
        if trans_date >= start_date:
            period_transactions.append(Transaction(**t))
    
    return period_transactions

@api_router.get("/stats/week", response_model=PeriodStats)
async def get_week_stats(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await get_period_transactions(user_id, week_start)
    total_income = sum(t.amount for t in transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=transactions
    )

@api_router.get("/stats/month", response_model=PeriodStats)
async def get_month_stats(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await get_period_transactions(user_id, month_start)
    total_income = sum(t.amount for t in transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=transactions
    )

@api_router.get("/stats/year", response_model=PeriodStats)
async def get_year_stats(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await get_period_transactions(user_id, year_start)
    total_income = sum(t.amount for t in transactions if t.type == "entrada")
    total_expense = sum(t.amount for t in transactions if t.type == "saida")
    
    return PeriodStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transactions=transactions
    )

@api_router.post("/tips")
async def generate_tips(request: TipsRequest, user_id: str = Depends(get_current_user)):
    if request.period == "week":
        stats = await get_week_stats(user_id)
    elif request.period == "month":
        stats = await get_month_stats(user_id)
    else:
        stats = await get_year_stats(user_id)
    
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
async def send_reminder(request: EmailRequest, user_id: str = Depends(get_current_user)):
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
async def get_pending_reminders(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    
    transactions = await db.transactions.find(
        {"user_id": user_id, "has_reminder": True, "reminder_sent": False},
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
async def create_budget(input: BudgetCreate, user_id: str = Depends(get_current_user)):
    budget_obj = Budget(user_id=user_id, **input.model_dump())
    doc = budget_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.budgets.insert_one(doc)
    return budget_obj

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for b in budgets:
        if isinstance(b['created_at'], str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return budgets

@api_router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, limit: float, user_id: str = Depends(get_current_user)):
    existing = await db.budgets.find_one({"id": budget_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    await db.budgets.update_one({"id": budget_id}, {"$set": {"limit": limit}})
    updated = await db.budgets.find_one({"id": budget_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user_id: str = Depends(get_current_user)):
    result = await db.budgets.delete_one({"id": budget_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return {"message": "Orçamento deletado com sucesso"}

@api_router.get("/categories/stats")
async def get_categories_stats(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    budgets = await db.budgets.find({"user_id": user_id, "period": "month"}, {"_id": 0}).to_list(1000)
    
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
async def get_period_comparison(user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if now.month == 1:
        previous_month_start = current_month_start.replace(year=now.year - 1, month=12)
    else:
        previous_month_start = current_month_start.replace(month=now.month - 1)
    
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
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

@api_router.get("/export/csv")
async def export_transactions_csv(user_id: str = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Data", "Tipo", "Categoria", "Descrição", "Valor"])
    
    for t in transactions:
        date_str = datetime.fromisoformat(t['date']).strftime("%d/%m/%Y")
        tipo = "Entrada" if t['type'] == "entrada" else "Saída"
        writer.writerow([
            date_str,
            tipo,
            t['category'],
            t['description'],
            f"R$ {t['amount']:.2f}"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transacoes.csv"}
    )

@api_router.get("/recurring")
async def get_recurring_transactions(user_id: str = Depends(get_current_user)):
    recurring = await db.recurring_transactions.find({"user_id": user_id, "active": True}, {"_id": 0}).to_list(1000)
    for r in recurring:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return recurring

@api_router.delete("/recurring/{recurring_id}")
async def delete_recurring_transaction(recurring_id: str, user_id: str = Depends(get_current_user)):
    result = await db.recurring_transactions.update_one(
        {"id": recurring_id, "user_id": user_id},
        {"$set": {"active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transação recorrente não encontrada")
    return {"message": "Recorrência cancelada com sucesso"}

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

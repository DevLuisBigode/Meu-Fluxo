# Meu Fluxo 💰

Sistema inteligente de gestão financeira pessoal com IA integrada.

## 📋 Funcionalidades

### Dashboard Principal
- **Saldo Semanal Colorido**: Card grande mostrando saldo da semana (verde para positivo, vermelho para negativo)
- **Dicas Inteligentes com IA**: Sugestões personalizadas baseadas nos seus padrões de gastos usando Gemini 3 Flash
- **Gráfico de Fluxo de Caixa**: Visualização em barras de entradas e saídas
- **Transações Recentes**: Lista das últimas 5 transações

### Gestão de Transações
- Criar, editar e deletar transações
- Campos: valor, data, tipo (entrada/saída), categoria, descrição
- Sistema de lembretes com notificações por e-mail
- Categorias predefinidas: Salário, Moradia, Alimentação, Transporte, Lazer, Saúde, Educação, Compras, Outros

### Categorias & Orçamentos 🆕
- **Gráfico de Pizza**: Visualização da distribuição de gastos por categoria
- **Orçamentos Mensais**: Defina limites de gastos para cada categoria
- **Barras de Progresso**: Acompanhe quanto já gastou em relação ao orçamento
- **Alertas Visuais**: Indicadores coloridos quando o limite é excedido ou está próximo

### Comparação de Períodos 🆕
- **Mês Atual vs Anterior**: Compare receitas, despesas e saldo entre períodos
- **Indicadores de Mudança**: Visualize se houve aumento ou redução percentual
- **Análise Resumida**: Insights automáticos sobre sua situação financeira

### Visualizações por Período
- **Semana**: Transações da semana atual
- **Mês**: Transações do mês atual
- **Ano**: Transações do ano atual
- Estatísticas de cada período: Total de entradas, total de saídas e saldo

### Recursos Adicionais
- **Exportação de Dados**: Baixe todas as suas transações em formato CSV 🆕
- Modo escuro/claro
- Interface responsiva (desktop e mobile)
- Design moderno com tema "Organic Flow"
- Animações e transições suaves

## 🛠️ Tecnologias

### Backend
- **FastAPI**: Framework web Python
- **MongoDB**: Banco de dados NoSQL
- **Gemini 3 Flash**: IA para geração de dicas financeiras
- **Resend**: Serviço de envio de e-mails para lembretes
- **Motor**: Driver assíncrono MongoDB

### Frontend
- **React 19**: Biblioteca JavaScript
- **Tailwind CSS**: Framework CSS utility-first
- **Recharts**: Biblioteca de gráficos
- **Shadcn/UI**: Componentes UI modernos
- **Lucide React**: Ícones
- **Sonner**: Notificações toast

## 🚀 Como Usar

### Backend
O backend já está rodando em `REACT_APP_BACKEND_URL` (da variável de ambiente).

### Frontend
Acesse a aplicação em `http://localhost:3000`

### Navegação
- **Dashboard**: Visão geral das finanças
- **Semana**: Detalhes da semana atual
- **Mês**: Detalhes do mês atual
- **Ano**: Detalhes do ano atual

## 📊 API Endpoints

### Transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions` - Listar todas as transações
- `GET /api/transactions/{id}` - Obter transação específica
- `PUT /api/transactions/{id}` - Atualizar transação
- `DELETE /api/transactions/{id}` - Deletar transação

### Estatísticas
- `GET /api/stats/week` - Estatísticas da semana
- `GET /api/stats/month` - Estatísticas do mês
- `GET /api/stats/year` - Estatísticas do ano

### Dicas IA
- `POST /api/tips` - Gerar dicas personalizadas
  - Body: `{"period": "week" | "month" | "year"}`

### Lembretes
- `GET /api/reminders` - Listar lembretes pendentes
- `POST /api/send-reminder` - Enviar lembrete por e-mail

## 🎨 Design

O design segue o conceito "Organic Flow" com:
- **Cores**: Verde esmeralda para positivo, vermelho rosado para negativo
- **Fontes**: Manrope (títulos e números), Outfit (corpo)
- **Layout**: Bento Grid adaptativo
- **Estilo**: Cards arredondados (rounded-3xl), sombras suaves, glass-morphism

## 🔑 Variáveis de Ambiente

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-817F87472668054F93
RESEND_API_KEY=re_your_api_key_here
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://moneywise-125.preview.emergentagent.com
```

## 📝 Notas

- As dicas da IA são geradas em tempo real usando Gemini 3 Flash
- O sistema de lembretes permite marcar transações importantes
- Todos os dados são persistidos no MongoDB
- A interface é totalmente responsiva

export const getReportTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --emerald-50: #ecfdf5;
      --emerald-100: #d1fae5;
      --emerald-200: #a7f3d0;
      --emerald-300: #6ee7b7;
      --emerald-400: #34d399;
      --emerald-500: #10b981;
      --emerald-600: #059669;
      --emerald-700: #047857;
      --emerald-800: #065f46;
      --emerald-900: #064e3b;
      
      --gray-50: #fafafa;
      --gray-100: #f4f4f5;
      --gray-200: #e4e4e7;
      --gray-300: #d4d4d8;
      --gray-400: #a1a1aa;
      --gray-500: #71717a;
      --gray-600: #52525b;
      --gray-700: #3f3f46;
      --gray-800: #27272a;
      --gray-900: #18181b;
      
      --red-500: #ef4444;
      --red-600: #dc2626;
      --amber-500: #f59e0b;
      --amber-600: #d97706;
    }

    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--gray-900); 
      background: white;
      font-size: 10px; 
      line-height: 1.6;
      letter-spacing: -0.01em;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 15mm;
      margin: 0 auto;
      background: white;
      position: relative;
    }

    /* UTILITIES */
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-emerald { color: var(--emerald-600); }
    .text-gray { color: var(--gray-500); }
    .text-red { color: var(--red-600); }
    .text-amber { color: var(--amber-600); }
    .font-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: -0.5px; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-light { font-weight: 300; }
    .uppercase { text-transform: uppercase; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .items-center { align-items: center; }
    .items-end { align-items: flex-end; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-8 { margin-bottom: 32px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }

    /* HEADER */
    .header {
      border-bottom: 2px solid var(--emerald-600);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    
    .brand { 
      font-size: 24px; 
      font-weight: 800; 
      letter-spacing: -1px; 
      color: var(--emerald-600);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .brand-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, var(--emerald-500), var(--emerald-700));
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      font-weight: 800;
    }

    .subtitle { 
      font-size: 9px; 
      letter-spacing: 1.5px; 
      color: var(--gray-500); 
      font-weight: 600;
      margin-top: 4px;
    }

    /* HEALTH SCORE BADGE */
    .health-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    .health-excellent { background: var(--emerald-100); color: var(--emerald-800); }
    .health-good { background: var(--emerald-50); color: var(--emerald-700); }
    .health-moderate { background: #fef3c7; color: #92400e; }
    .health-poor { background: #fee2e2; color: #991b1b; }

    /* META INFO */
    .meta-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 16px; 
      margin-bottom: 24px;
      padding: 16px;
      background: var(--gray-50);
      border-radius: 8px;
    }
    
    .meta-item {
      border-left: 2px solid var(--emerald-500);
      padding-left: 12px;
    }
    
    .meta-label { 
      display: block; 
      font-size: 8px; 
      text-transform: uppercase; 
      color: var(--gray-500); 
      font-weight: 600; 
      letter-spacing: 0.5px; 
      margin-bottom: 4px; 
    }
    
    .meta-value { 
      font-size: 11px; 
      font-weight: 600; 
      color: var(--gray-900);
    }

    /* KPI CARDS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--emerald-500), var(--emerald-300));
    }

    .kpi-label { 
      font-size: 8px; 
      text-transform: uppercase; 
      color: var(--gray-500); 
      font-weight: 600; 
      letter-spacing: 0.5px;
      margin-bottom: 8px; 
    }
    
    .kpi-value { 
      font-size: 20px; 
      font-weight: 800; 
      color: var(--gray-900); 
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    
    .kpi-sub { 
      font-size: 9px; 
      color: var(--gray-500); 
      font-weight: 500;
    }

    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      font-weight: 600;
      margin-top: 4px;
    }

    .trend-up { color: var(--red-600); }
    .trend-down { color: var(--emerald-600); }
    .trend-stable { color: var(--gray-500); }

    /* PROGRESS BAR */
    .progress-section {
      background: var(--gray-50);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .progress-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--gray-700);
    }

    .progress-percentage {
      font-size: 16px;
      font-weight: 800;
      color: var(--emerald-600);
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: white;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--emerald-500), var(--emerald-400));
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .progress-fill.warning { background: linear-gradient(90deg, var(--amber-500), var(--amber-400)); }
    .progress-fill.danger { background: linear-gradient(90deg, var(--red-600), var(--red-500)); }

    .progress-markers {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 8px;
      color: var(--gray-400);
      font-family: 'JetBrains Mono';
    }

    /* SECTION HEADER */
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--emerald-500);
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--gray-900);
    }

    .section-icon {
      width: 20px;
      height: 20px;
      background: var(--emerald-100);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--emerald-700);
      font-size: 11px;
    }

    /* TABLES */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 16px;
    }
    
    thead {
      background: var(--gray-50);
    }

    th { 
      text-align: left; 
      font-size: 8px; 
      text-transform: uppercase; 
      color: var(--gray-600); 
      padding: 10px 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    
    td { 
      padding: 12px; 
      border-bottom: 1px solid var(--gray-100); 
      font-size: 10px; 
      vertical-align: middle;
    }
    
    tr:last-child td { border-bottom: none; }
    
    tbody tr:hover {
      background: var(--gray-50);
    }

    .category-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-dot { 
      width: 8px; 
      height: 8px; 
      border-radius: 50%; 
      flex-shrink: 0;
    }

    .mini-progress {
      width: 60px;
      height: 4px;
      background: var(--gray-200);
      border-radius: 2px;
      overflow: hidden;
      display: inline-block;
      margin-right: 8px;
    }

    .mini-progress-fill {
      height: 100%;
      border-radius: 2px;
    }

    /* LAYOUT */
    .two-column {
      display: grid;
      grid-template-columns: 1.4fr 0.6fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    /* CARDS */
    .card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .card-compact {
      padding: 12px;
    }

    /* STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-item {
      background: var(--gray-50);
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid var(--emerald-500);
    }

    .stat-label {
      font-size: 8px;
      text-transform: uppercase;
      color: var(--gray-500);
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 800;
      color: var(--gray-900);
    }

    /* INSIGHT BOX */
    .insight-box {
      background: linear-gradient(135deg, var(--emerald-50), var(--emerald-100));
      border-left: 4px solid var(--emerald-600);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .insight-title {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: var(--emerald-900);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .insight-content {
      font-size: 10px;
      line-height: 1.6;
      color: var(--emerald-900);
    }

    /* WEEKLY CHART */
    .weekly-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 100px;
      gap: 8px;
      padding: 12px;
      background: var(--gray-50);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .week-bar {
      flex: 1;
      background: var(--emerald-500);
      border-radius: 4px 4px 0 0;
      position: relative;
      min-height: 10px;
      transition: all 0.3s ease;
    }

    .week-label {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      color: var(--gray-600);
      font-weight: 600;
      white-space: nowrap;
    }

    /* EXPENSE LIST */
    .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--gray-100);
    }

    .expense-item:last-child {
      border-bottom: none;
    }

    .expense-left {
      flex: 1;
    }

    .expense-date {
      font-size: 8px;
      color: var(--gray-500);
      font-family: 'JetBrains Mono';
      margin-bottom: 2px;
    }

    .expense-desc {
      font-size: 10px;
      font-weight: 500;
      color: var(--gray-900);
    }

    .expense-category-tag {
      display: inline-block;
      font-size: 8px;
      padding: 2px 6px;
      background: var(--emerald-50);
      color: var(--emerald-700);
      border-radius: 3px;
      margin-left: 6px;
    }

    .expense-amount {
      font-family: 'JetBrains Mono';
      font-size: 11px;
      font-weight: 700;
      color: var(--gray-900);
    }

    /* COMPARISON BADGE */
    .comparison-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }

    .comparison-up {
      background: #fee2e2;
      color: #991b1b;
    }

    .comparison-down {
      background: var(--emerald-100);
      color: var(--emerald-800);
    }

    /* FOOTER */
    .footer {
      position: absolute;
      bottom: 12mm;
      left: 15mm;
      right: 15mm;
      border-top: 1px solid var(--gray-200);
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--gray-400);
      font-size: 8px;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .report-id {
      font-family: 'JetBrains Mono';
      color: var(--gray-500);
      font-weight: 600;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; }
      .page { box-shadow: none; margin: 0; padding: 12mm 15mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    
    <!-- HEADER -->
    <header class="header">
      <div class="flex justify-between items-center">
        <div>
          <div class="brand">
            <div class="brand-icon">$</div>
            SmartGasto
          </div>
          <div class="subtitle">RELATÓRIO FINANCEIRO MENSAL</div>
        </div>
        <div class="text-right">
          <div class="health-badge health-${data.financialHealth.level}">
            <span>💚</span>
            <span>Saúde: ${data.financialHealth.score}/100</span>
          </div>
          <div class="font-semibold mt-2" style="font-size: 12px;">${data.userName}</div>
          <div class="text-gray" style="font-size: 10px;">${data.month} ${data.year}</div>
        </div>
      </div>
    </header>

    <!-- META INFO -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Data de Emissão</span>
        <span class="meta-value">${data.generatedAt}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Status do Período</span>
        <span class="meta-value">
          ${data.daysRemaining > 0 ? `Em andamento (${data.daysRemaining}d restantes)` : 'Período fechado'}
        </span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total de Transações</span>
        <span class="meta-value">${data.expenseFrequency.totalTransactions}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Dia Mais Ativo</span>
        <span class="meta-value">${data.expenseFrequency.mostActiveDay}</span>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Gasto</div>
        <div class="kpi-value font-mono text-emerald">R$ ${data.totalExpenses.toFixed(2)}</div>
        <div class="kpi-sub">${data.daysInMonth} dias no período</div>
        ${
          data.comparison.trend !== 'stable'
            ? `
          <div class="kpi-trend trend-${data.comparison.trend}">
            <span>${data.comparison.trend === 'up' ? '↑' : '↓'}</span>
            <span>${Math.abs(data.comparison.percentageChange).toFixed(1)}% vs mês anterior</span>
          </div>
        `
            : ''
        }
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Orçamento Mensal</div>
        <div class="kpi-value font-mono">R$ ${data.budgetInfo.monthlyBudget.toFixed(2)}</div>
        <div class="kpi-sub">Meta definida</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Saldo Disponível</div>
        <div class="kpi-value font-mono ${data.budgetInfo.remaining < 0 ? 'text-red' : 'text-emerald'}">
          R$ ${Math.abs(data.budgetInfo.remaining).toFixed(2)}
        </div>
        <div class="kpi-sub">${data.budgetInfo.remaining < 0 ? 'Estouro' : (100 - data.budgetInfo.percentageUsed).toFixed(1) + '% livre'}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Média Diária</div>
        <div class="kpi-value font-mono">R$ ${data.dailyAverage.toFixed(2)}</div>
        <div class="kpi-sub">Ritmo de gastos</div>
        ${
          data.daysRemaining > 0
            ? `
          <div class="kpi-trend ${data.budgetInfo.remaining / data.daysRemaining < data.dailyAverage ? 'trend-up' : 'trend-down'}">
            <span>Limite: R$ ${(data.budgetInfo.remaining / data.daysRemaining).toFixed(2)}/dia</span>
          </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- PROGRESS SECTION -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-title">Consumo do Orçamento</span>
        <span class="progress-percentage font-mono">${data.budgetInfo.percentageUsed.toFixed(1)}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${data.budgetInfo.percentageUsed > 100 ? 'danger' : data.budgetInfo.percentageUsed > 80 ? 'warning' : ''}" 
             style="width: ${Math.min(data.budgetInfo.percentageUsed, 100)}%"></div>
      </div>
      <div class="progress-markers">
        <span>R$ 0</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>R$ ${data.budgetInfo.monthlyBudget.toFixed(2)}</span>
      </div>
    </div>

    <!-- WEEKLY BREAKDOWN -->
    <div class="card">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <h3 class="section-title">Distribuição Semanal</h3>
      </div>
      <div class="weekly-chart" style="margin-bottom: 30px;">
        ${data.weeklyBreakdown
          .map((week: any, index: number) => {
            const maxWeekTotal = Math.max(
              ...data.weeklyBreakdown.map((w: any) => w.total),
            );
            const height =
              maxWeekTotal > 0 ? (week.total / maxWeekTotal) * 80 : 10;
            return `
            <div class="week-bar" style="height: ${height}px; background: ${week.total > data.dailyAverage * 7 ? 'var(--amber-500)' : 'var(--emerald-500)'}">
              <div class="week-label">S${index + 1}</div>
            </div>
          `;
          })
          .join('')}
      </div>
      <div class="stats-grid">
        ${data.weeklyBreakdown
          .map(
            (week: any, index: number) => `
          <div class="stat-item">
            <div class="stat-label">Semana ${index + 1}</div>
            <div class="stat-value font-mono" style="font-size: 14px;">R$ ${week.total.toFixed(2)}</div>
            <div class="kpi-sub">Média: R$ ${week.average.toFixed(2)}/dia</div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <!-- TWO COLUMN LAYOUT -->
    <div class="two-column">
      
      <!-- LEFT: CATEGORIES -->
      <div>
        <div class="card">
          <div class="section-header">
            <div class="section-icon">🏷️</div>
            <h3 class="section-title">Análise por Categoria</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th class="text-right">Tendência</th>
                <th class="text-right">Participação</th>
                <th class="text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.categories
                .slice(0, 8)
                .map(
                  (cat: any) => `
                <tr>
                  <td>
                    <div class="category-indicator">
                      <span class="category-dot" style="background-color: ${cat.color}"></span>
                      <span class="font-medium">${cat.name}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="kpi-trend trend-${cat.trend}" style="font-size: 8px;">
                      ${cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                      ${cat.trendPercentage > 0 ? cat.trendPercentage.toFixed(0) + '%' : ''}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-2">
                      <div class="mini-progress">
                        <div class="mini-progress-fill" style="width: ${cat.percentage}%; background: ${cat.color}"></div>
                      </div>
                      <span class="font-mono font-semibold" style="font-size: 9px;">${cat.percentage}%</span>
                    </div>
                  </td>
                  <td class="text-right font-mono font-semibold">R$ ${cat.totalSpent.toFixed(2)}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          ${
            data.categories.length > 8
              ? `
            <div class="text-gray text-right" style="font-size: 8px; margin-top: 8px;">
              + ${data.categories.length - 8} outras categorias
            </div>
          `
              : ''
          }
        </div>

        <!-- INSIGHTS -->
        <div class="insight-box">
          <div class="insight-title">
            <span>💡</span>
            <span>Análise Inteligente</span>
          </div>
          <div class="insight-content">
            <p style="margin-bottom: 8px;">
              <strong>Maior categoria:</strong> ${data.insights.biggestCategory} representa 
              <strong>${data.insights.biggestCategoryPercentage.toFixed(1)}%</strong> dos seus gastos.
            </p>
            <p style="margin-bottom: 8px;">
              <strong>Ticket médio:</strong> R$ ${data.insights.averageTicket.toFixed(2)} por transação.
            </p>
            ${
              data.budgetInfo.percentageUsed > 90
                ? '<p style="color: var(--red-600); font-weight: 600;">⚠️ Atenção crítica! Orçamento quase esgotado. Considere congelar gastos não essenciais.</p>'
                : data.daysRemaining > 0
                  ? `<p><strong>Projeção:</strong> Com o ritmo atual, você deve finalizar o mês com R$ ${data.projectedTotal.toFixed(2)}. ${data.projectedTotal > data.budgetInfo.monthlyBudget ? '⚠️ Acima do orçamento!' : '✓ Dentro do orçamento.'}</p>`
                  : '<p>✓ Período encerrado. Revise categorias com tendência de alta para o próximo mês.</p>'
            }
          </div>
        </div>
      </div>

      <!-- RIGHT: TOP EXPENSES & STATS -->
      <div>
        <div class="card card-compact">
          <div class="section-header">
            <div class="section-icon">🔝</div>
            <h3 class="section-title">Maiores Gastos</h3>
          </div>
          <div style="max-height: 280px; overflow-y: auto;">
            ${data.topExpenses
              .map(
                (exp: any) => `
              <div class="expense-item">
                <div class="expense-left">
                  <div class="expense-date">${exp.date}</div>
                  <div class="expense-desc">
                    ${exp.description}
                    <span class="expense-category-tag">${exp.category}</span>
                  </div>
                </div>
                <div class="expense-amount">R$ ${exp.amount.toFixed(2)}</div>
              </div>
            `,
              )
              .join('')}
            ${data.topExpenses.length === 0 ? '<div class="text-gray text-center" style="padding: 20px;">Nenhum gasto registrado</div>' : ''}
          </div>
        </div>

        ${
          data.insights.expensiveDays.length > 0
            ? `
          <div class="card card-compact mt-4">
            <div class="section-header">
              <div class="section-icon">📅</div>
              <h3 class="section-title">Dias Mais Caros</h3>
            </div>
            ${data.insights.expensiveDays
              .map(
                (day: any, index: number) => `
              <div class="expense-item">
                <div class="expense-left">
                  <div class="expense-desc font-semibold">${day.date}</div>
                  <div class="kpi-sub">#${index + 1} dia mais caro</div>
                </div>
                <div class="expense-amount text-amber">R$ ${day.total.toFixed(2)}</div>
              </div>
            `,
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="card card-compact mt-4">
          <div class="section-header">
            <div class="section-icon">📈</div>
            <h3 class="section-title">Comparativo</h3>
          </div>
          <div class="stat-item mb-3">
            <div class="stat-label">Mês Anterior</div>
            <div class="stat-value font-mono" style="font-size: 14px;">R$ ${data.comparison.lastMonth.toFixed(2)}</div>
            <div class="comparison-badge comparison-${data.comparison.trend}" style="margin-top: 6px;">
              <span>${data.comparison.trend === 'up' ? '↑' : data.comparison.trend === 'down' ? '↓' : '→'}</span>
              <span>${data.comparison.trend === 'up' ? '+' : data.comparison.trend === 'down' ? '-' : ''}${Math.abs(data.comparison.percentageChange).toFixed(1)}%</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Diferença Absoluta</div>
            <div class="stat-value font-mono ${data.comparison.difference > 0 ? 'text-red' : 'text-emerald'}" style="font-size: 14px;">
              ${data.comparison.difference > 0 ? '+' : ''}R$ ${data.comparison.difference.toFixed(2)}
            </div>
          </div>
        </div>

        <div class="card card-compact mt-4" style="background: linear-gradient(135deg, var(--emerald-50), white);">
          <div class="section-header">
            <div class="section-icon">💪</div>
            <h3 class="section-title">Saúde Financeira</h3>
          </div>
          <div class="text-center mb-3">
            <div style="font-size: 32px; font-weight: 800; color: var(--emerald-600);">${data.financialHealth.score}</div>
            <div class="kpi-sub">de 100 pontos</div>
          </div>
          <div class="stat-item mb-2">
            <div class="stat-label">Orçamento</div>
            <div class="flex justify-between items-center">
              <span class="font-semibold">${data.financialHealth.factors.budgetCompliance}/40</span>
              <div class="mini-progress" style="width: 100px;">
                <div class="mini-progress-fill" style="width: ${(data.financialHealth.factors.budgetCompliance / 40) * 100}%; background: var(--emerald-500)"></div>
              </div>
            </div>
          </div>
          <div class="stat-item mb-2">
            <div class="stat-label">Consistência</div>
            <div class="flex justify-between items-center">
              <span class="font-semibold">${data.financialHealth.factors.consistency}/30</span>
              <div class="mini-progress" style="width: 100px;">
                <div class="mini-progress-fill" style="width: ${(data.financialHealth.factors.consistency / 30) * 100}%; background: var(--emerald-500)"></div>
              </div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Diversificação</div>
            <div class="flex justify-between items-center">
              <span class="font-semibold">${data.financialHealth.factors.diversification}/30</span>
              <div class="mini-progress" style="width: 100px;">
                <div class="mini-progress-fill" style="width: ${(data.financialHealth.factors.diversification / 30) * 100}%; background: var(--emerald-500)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-left">
        <span>SmartGasto Report</span>
        <span class="report-id">#${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
      </div>
      <div>Página 1 de 1</div>
      <div>Gerado em ${data.generatedAt}</div>
    </div>

  </div>
</body>
</html>
`;

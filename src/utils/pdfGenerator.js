import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function generatePayrollPDF(payrollData, employeeInfo, period) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1A1A2E; }
        .header { 
          background: linear-gradient(135deg, #E77603, #F5A623);
          color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;
        }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-box { background: #F8F9FA; padding: 16px; border-radius: 10px; border-left: 4px solid #3E9C99; }
        .info-box label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; }
        .info-box p { font-size: 16px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #3E9C99; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
        td { padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        tr:nth-child(even) { background: #F9FAFB; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #E77603; }
        .footer { 
          margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;
          font-size: 11px; color: #9CA3AF; text-align: center;
        }
        .hash { 
          background: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px; border-radius: 8px;
          font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 DOMUS</h1>
        <p>Relatório de Folha de Pagamento — ${period}</p>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <label>Empregado(a)</label>
          <p>${employeeInfo.name}</p>
        </div>
        <div class="info-box">
          <label>CPF</label>
          <p>${employeeInfo.cpf || "---"}</p>
        </div>
        <div class="info-box">
          <label>Função</label>
          <p>${employeeInfo.role || "Empregado(a) Doméstico(a)"}</p>
        </div>
        <div class="info-box">
          <label>Período</label>
          <p>${period}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th style="text-align:right">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Salário Base</td>
            <td style="text-align:right">${payrollData.baseSalary.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Horas Extras (${payrollData.overtimeHours}h × 50%)</td>
            <td style="text-align:right">+ ${payrollData.overtimeValue.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Adicional Noturno (${payrollData.nightHours}h)</td>
            <td style="text-align:right">+ ${payrollData.nightValue.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Salário Bruto</strong></td>
            <td style="text-align:right"><strong>${payrollData.grossSalary.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td>INSS (desconto)</td>
            <td style="text-align:right; color: #EF4444;">- ${payrollData.inss.toFixed(2)}</td>
          </tr>
          <tr>
            <td>FGTS (encargo empregador)</td>
            <td style="text-align:right; color: #6B7280;">${payrollData.fgts.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>💰 Salário Líquido</td>
            <td style="text-align:right; color: #10B981;">${payrollData.netSalary.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="hash">
        <strong>🔒 Prova Digital (SHA-256):</strong><br>
        ${payrollData.hash || "a1b2c3d4e5f6..."}
      </div>

      <div class="footer">
        <p>Documento gerado pelo DOMUS — Plataforma Inteligente de Gestão Trabalhista</p>
        <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <p>Este documento possui validade como prova digital conforme LC 150/2015 e Portaria MTP 671/2021</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
    return { success: true, uri };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function generateEmployeeHoursPDF(employee, summary, days) {
  const rows = days
    .map(
      (day) => `
      <tr>
        <td>${day.date}</td>
        <td style="text-align:right">${day.worked.toFixed(2)}h</td>
        <td style="text-align:right">${day.overtime.toFixed(2)}h</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; padding: 28px; color: #1F2937; }
        .header {
          background: linear-gradient(135deg, #3E9C99, #4DB6B3);
          color: #fff; border-radius: 10px; padding: 18px; margin-bottom: 18px;
        }
        .header h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { display: flex; gap: 10px; margin-bottom: 16px; }
        .box { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px; }
        .box .label { font-size: 11px; color: #6B7280; text-transform: uppercase; }
        .box .value { font-size: 15px; font-weight: 700; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { text-align: left; background: #F3F4F6; padding: 10px; font-size: 12px; }
        td { border-bottom: 1px solid #E5E7EB; padding: 10px; font-size: 12px; }
        .footer { margin-top: 18px; font-size: 10px; color: #9CA3AF; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DOMUS - Relatório Individual</h1>
        <p>Horas trabalhadas por funcionário</p>
      </div>

      <div class="meta">
        <div class="box">
          <div class="label">Funcionário</div>
          <div class="value">${employee?.name || "Sem nome"}</div>
        </div>
        <div class="box">
          <div class="label">Função</div>
          <div class="value">${employee?.role || "Funcionário"}</div>
        </div>
      </div>

      <div class="meta">
        <div class="box">
          <div class="label">Horas trabalhadas</div>
          <div class="value">${summary.worked.toFixed(2)}h</div>
        </div>
        <div class="box">
          <div class="label">Horas extras</div>
          <div class="value">${summary.overtime.toFixed(2)}h</div>
        </div>
        <div class="box">
          <div class="label">Dias válidos</div>
          <div class="value">${summary.days}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th style="text-align:right">Horas</th>
            <th style="text-align:right">Extras</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="3">Sem registros válidos no período.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - DOMUS
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
    return { success: true, uri };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

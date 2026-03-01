import type { ContractData } from "@/lib/types";

const toCurrency = (value?: number | null) =>
  value === null || value === undefined
    ? "0,00"
    : value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const buildClauseLines = (reservationEndDate: string) => [
  "1. Não colocar cola quente, fita adesiva, grampo ou pregos na decoração.",
  "2. Não furar o bolo fake para utilização de velas ou usar velas faísca no bolo.",
  "3. Taxa de limpeza será cobrada se o material for entregue sujo (R$ 20,00 por item).",
  `4. A devolução da decoração deverá ocorrer até ${reservationEndDate} sob multa de R$ 100,00 por dia de atraso.`,
  "5. O transporte é de responsabilidade do cliente.",
  "6. A reserva será confirmada mediante pagamento de 50% do valor.",
  "7. Cancelamentos não geram reembolso, podendo remarcar em até 6 meses.",
  "8. Não há troca de data com menos de 30 dias de antecedência.",
];

export const buildContractFileName = (contractData: ContractData, extension: "docx" | "pdf") => {
  const customerSlug = contractData.customerName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const safeCustomerSlug = customerSlug || "cliente";
  return `contrato-${safeCustomerSlug}.${extension}`;
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const printContract = (contractData: ContractData) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão.");
  }

  const clauses = buildClauseLines(contractData.reservationEndDate)
    .map((clause) => `<p>${clause}</p>`)
    .join("");

  const html = `
    <html>
      <head>
        <title>Contrato - ${contractData.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 900px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 16px; }
          h2 { font-size: 16px; margin: 20px 0 8px; }
          p { margin: 6px 0; line-height: 1.45; }
          .signature { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>CONTRATO DE LOCAÇÃO DE DECORAÇÃO</h1>
        <h2>CLIENTE:</h2>
        <p>Nome: ${contractData.customerName}</p>
        <p>CPF: ${contractData.customerDocumentNumber}</p>
        <p>Endereço: ${contractData.customerAddress}</p>
        <p>Bairro: ${contractData.customerNeighborhood || "Não informado"}</p>
        <p>Cidade: ${contractData.customerCity || "Não informado"}</p>
        <p>Data da retirada: ${contractData.reservationStartDate}</p>

        <h2>CLÁUSULAS</h2>
        ${clauses}

        <h2>DECORAÇÃO ENTREGUE:</h2>
        <p>${contractData.kitThemeName}</p>
        <p>VALOR TOTAL: R$ ${toCurrency(contractData.totalAmount)}</p>
        <p>VALOR DE ENTRADA: R$ ${toCurrency(contractData.entryAmount)}</p>
        <p>*É proibido o uso de vela faísca no bolo.*</p>
        <p>Em caso de não devolução ou dano, será cobrado o valor vigente das peças.</p>

        <h2>ASSINATURAS</h2>
        <p class="signature">Cliente : ___________________________</p>
        <p>Empresa : ___________________________</p>
        <p>Data: ${contractData.contractDate}</p>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

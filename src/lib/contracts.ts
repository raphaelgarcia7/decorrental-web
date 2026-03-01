import type { ContractData } from "@/lib/types";

const toYesNo = (value: boolean) => (value ? "Sim" : "Não");
const toCurrency = (value?: number | null) =>
  value === null || value === undefined
    ? "0,00"
    : value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    throw new Error("Nao foi possivel abrir a janela de impressao.");
  }

  const html = `
    <html>
      <head>
        <title>Contrato - ${contractData.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 16px; }
          h2 { font-size: 16px; margin-top: 24px; }
          p { margin: 4px 0; }
          .signatures { margin-top: 40px; }
        </style>
      </head>
      <body>
        <h1>Contrato de Locação de Decoração</h1>
        <p><strong>Cliente:</strong> ${contractData.customerName}</p>
        <p><strong>Documento:</strong> ${contractData.customerDocumentNumber}</p>
        <p><strong>Telefone:</strong> ${contractData.customerPhoneNumber}</p>
        <p><strong>Endereço:</strong> ${contractData.customerAddress}</p>
        <p><strong>Bairro:</strong> ${contractData.customerNeighborhood || "Não informado"}</p>
        <p><strong>Cidade:</strong> ${contractData.customerCity || "Não informado"}</p>
        <p><strong>Tema:</strong> ${contractData.kitThemeName}</p>
        <p><strong>Categoria:</strong> ${contractData.kitCategoryName}</p>
        <p><strong>Período:</strong> ${contractData.reservationStartDate} até ${contractData.reservationEndDate}</p>
        <p><strong>Valor total:</strong> R$ ${toCurrency(contractData.totalAmount)}</p>
        <p><strong>Valor de entrada:</strong> R$ ${toCurrency(contractData.entryAmount)}</p>
        <p><strong>Arco de balões:</strong> ${toYesNo(contractData.hasBalloonArch)}</p>
        <p><strong>Entrada paga:</strong> ${toYesNo(contractData.isEntryPaid)}</p>
        <p><strong>Observações:</strong> ${contractData.notes || "Não informado."}</p>
        <div class="signatures">
          <h2>Assinaturas</h2>
          <p>Cliente: ___________________________</p>
          <p>Empresa: ___________________________</p>
          <p>Data: ${contractData.contractDate}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportReportToPdf = async (elementId, filename = 'Bao_Cao_SalonFlow.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Không tìm thấy phần tử DOM với ID: ${elementId}`);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};

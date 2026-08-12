import ExcelJS from 'exceljs';

export const exportReportToExcel = async ({ reportType, fromDate, toDate, data, salonName = "SalonFlow" }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SalonFlow Management System';
  workbook.lastModifiedBy = 'SalonFlow Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Báo Cáo SalonFlow');

  // Title Banner
  worksheet.mergeCells('A1:F2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `📊 BÁO CÁO SALONFLOW - ${reportType === 'nhan_vien' ? 'HIỆU SUẤT NHÂN VIÊN' : reportType === 'dich_vu' ? 'SỬ DỤNG DỊCH VỤ' : 'DOANH THU KINH DOANH'}`;
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle Metadata
  worksheet.getCell('A3').value = `Đơn vị: ${salonName} | Kỳ báo cáo: Từ ${fromDate || '---'} Đến ${toDate || '---'} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  worksheet.getCell('A3').font = { name: 'Arial', size: 11, italic: true, color: { argb: '475569' } };
  worksheet.mergeCells('A3:F3');

  worksheet.addRow([]); // Blank row

  let headers = [];
  let rows = [];

  if (reportType === 'nhan_vien') {
    headers = ['Hạng', 'Tên Nhân Viên', 'Chi Nhánh', 'Số Lịch Hoàn Thành', 'Doanh Thu Đóng Góp (đ)', 'Rating (⭐)'];
    const staffList = data?.details?.staffPerformanceList || [];
    staffList.forEach((s) => {
      rows.push([
        s.overallRank || 1,
        s.staffName || '',
        s.branchName || '',
        s.completedBookings || 0,
        Number(s.totalRevenue || 0),
        s.avgRating || 5.0
      ]);
    });
  } else if (reportType === 'dich_vu') {
    headers = ['STT', 'Tên Dịch Vụ', 'Loại Dịch Vụ', 'Số Lượt Đặt', 'Doanh Thu Mang Về (đ)', 'Tỉ Lệ Đóng Góp (%)'];
    const breakdown = data?.details?.serviceBreakdown || [];
    breakdown.forEach((item, idx) => {
      rows.push([
        idx + 1,
        item.serviceName || item.categoryName || 'Dịch vụ lẻ',
        item.categoryName || 'Cắt gội tạo kiểu',
        item.bookingCount || 0,
        Number(item.revenue || 0),
        item.percentage || 0
      ]);
    });
  } else {
    // Doanh thu
    headers = ['STT', 'Thời Gian', 'Tổng Đơn Hàng', 'Doanh Thu (đ)', 'Tỉ Lệ Tăng Trưởng YoY (%)', 'Trạng Thái'];
    const timeline = data?.details?.timeline || [];
    timeline.forEach((t, idx) => {
      rows.push([
        idx + 1,
        t.dateLabel || t.periodLabel || '',
        t.bookingCount || 0,
        Number(t.revenue || 0),
        t.yoyGrowthRate || 0,
        'Thành công'
      ]);
    });
  }

  // Add Header Row
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { argb: '4338CA' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } }
    };
  });

  // Add Data Rows
  rows.forEach((r, idx) => {
    const row = worksheet.addRow(r);
    row.height = 22;

    const isZebra = idx % 2 === 1;
    row.eachCell((cell, colIndex) => {
      cell.font = { name: 'Arial', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: colIndex === 2 ? 'left' : 'center' };
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };

      // Currency Formatting for Revenue Column
      if (reportType === 'nhan_vien' && colIndex === 5) {
        cell.numFmt = '#,##0" đ"';
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '4F46E5' } };
      } else if (reportType === 'dich_vu' && colIndex === 5) {
        cell.numFmt = '#,##0" đ"';
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '4F46E5' } };
      } else if (reportType === 'doanh_thu' && colIndex === 4) {
        cell.numFmt = '#,##0" đ"';
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '4F46E5' } };
      }
    });
  });

  // Auto-fit Column Widths
  worksheet.columns.forEach((column) => {
    let maxLen = 15;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 10;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(Math.max(maxLen + 4, 15), 40);
  });

  // Write and Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bao_Cao_${reportType}_SalonFlow_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

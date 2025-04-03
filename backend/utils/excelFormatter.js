import * as XLSX from 'xlsx';

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function to format category names
const formatCategoryName = (category) => {
  if (!category) return '';
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Define column headers, their widths, and colors
const COLUMN_HEADERS = [
  { header: 'Tracking ID', key: 'trackingId', width: 15, color: 'FFE6F0' },
  { header: 'Name', key: 'name', width: 25, color: 'E6F3FF' },
  { header: 'Email', key: 'email', width: 30, color: 'E6F3FF' },
  { header: 'Category', key: 'category', width: 20, color: 'FFE6E6' },
  { header: 'Status', key: 'status', width: 15, color: 'E6FFE6' },
  { header: 'Priority', key: 'priority', width: 12, color: 'FFE6E6' },
  { header: 'Location', key: 'location', width: 20, color: 'E6F3FF' },
  { header: 'Department', key: 'department', width: 20, color: 'E6F3FF' },
  { header: 'School Level', key: 'schoolLevel', width: 15, color: 'E6F3FF' },
  { header: 'School Name', key: 'schoolName', width: 25, color: 'E6F3FF' },
  { header: 'Created At', key: 'createdAt', width: 20, color: 'FFE6F0' },
  { header: 'Equipment Type', key: 'typeOfEquipment', width: 20, color: 'E6FFE6' },
  { header: 'Equipment Model', key: 'modelOfEquipment', width: 20, color: 'E6FFE6' },
  { header: 'Serial No.', key: 'serialNo', width: 15, color: 'E6FFE6' },
  { header: 'Specific Problem', key: 'specificProblem', width: 40, color: 'FFE6E6' },
  { header: 'Assigned To', key: 'assignedTo', width: 20, color: 'E6F3FF' },
  { header: 'Diagnosis Details', key: 'diagnosisDetails', width: 40, color: 'E6FFE6' },
  { header: 'Fix Details', key: 'fixDetails', width: 40, color: 'E6FFE6' },
  { header: 'Date Fixed', key: 'dateFixed', width: 20, color: 'FFE6F0' },
  { header: 'Recommendations', key: 'recommendations', width: 40, color: 'E6FFE6' }
];

// Create Excel workbook with formatted data
export const createExcelWorkbook = (tickets) => {
  try {
    // Sort tickets by priority and category
    tickets.sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
      return a.category.localeCompare(b.category);
    });

    // Format dates in tickets
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      createdAt: formatDate(ticket.createdAt),
      dateFixed: formatDate(ticket.dateFixed)
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Create main worksheet
    const ws = XLSX.utils.json_to_sheet(formattedTickets, {
      header: COLUMN_HEADERS.map(col => col.key)
    });

    // Apply column widths and auto-fit
    ws['!cols'] = COLUMN_HEADERS.map(col => ({ 
      width: col.width,
      autofit: true 
    }));

    // Style the headers (make them bold and bigger)
    const headerStyle = {
      font: { bold: true, sz: 14, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: "CCCCCC" } },
      border: {
        top: { style: 'medium', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } },
        left: { style: 'medium', color: { rgb: '000000' } },
        right: { style: 'medium', color: { rgb: '000000' } }
      }
    };

    // Apply colors, borders, and conditional formatting
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      const columnHeader = COLUMN_HEADERS[C];
      
      // Style header cell
      if (!ws[headerCell].s) ws[headerCell].s = {};
      ws[headerCell].s = headerStyle;
      
      // Apply column styling and conditional formatting
      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;
        if (!ws[cell].s) ws[cell].s = {};

        // Base cell style
        ws[cell].s = {
          fill: { fgColor: { rgb: columnHeader.color } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };

        // Conditional formatting
        if (columnHeader.key === 'status' && ws[cell].v === 'PENDING') {
          ws[cell].s.font = { color: { rgb: 'FF0000' }, bold: true };
        }
        if (columnHeader.key === 'priority' && ws[cell].v === 'HIGH') {
          ws[cell].s.font = { color: { rgb: 'FF0000' }, bold: true };
        }
      }
    }

    // Add the main worksheet
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets Report');

    // Create pivot table worksheet
    const pivotWs = createPivotTable(formattedTickets);
    XLSX.utils.book_append_sheet(wb, pivotWs, 'Pivot Analysis');

    // Create summary worksheet with styling
    const summaryData = createSummarySheet(tickets);
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    
    // Style summary sheet
    styleSummarySheet(summaryWs);
    
    // Add summary worksheet
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    return wb;
  } catch (error) {
    console.error('Error creating Excel workbook:', error);
    throw error;
  }
};

// Create pivot table worksheet
const createPivotTable = (tickets) => {
  // Create pivot data for Status by Category
  const pivotData = [
    ['Status Distribution by Category'],
    ['Category', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'Total'],
  ];

  const categories = [...new Set(tickets.map(t => t.category))];
  const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

  categories.forEach(category => {
    const row = [category];
    const categoryTickets = tickets.filter(t => t.category === category);
    
    statuses.forEach(status => {
      const count = categoryTickets.filter(t => t.status === status).length;
      row.push(count);
    });
    
    row.push(categoryTickets.length); // Total
    pivotData.push(row);
  });

  // Create worksheet from pivot data
  const ws = XLSX.utils.aoa_to_sheet(pivotData);

  // Style pivot table
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell]) continue;
      if (!ws[cell].s) ws[cell].s = {};

      // Header styling
      if (R <= 1) {
        ws[cell].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: 'CCCCCC' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'medium', color: { rgb: '000000' } },
            right: { style: 'medium', color: { rgb: '000000' } }
          }
        };
      } else {
        // Data cell styling
        ws[cell].s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
  }

  // Set column widths
  ws['!cols'] = Array(range.e.c + 1).fill({ width: 15, autofit: true });

  return ws;
};

// Style summary sheet
const styleSummarySheet = (ws) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Apply styling to all cells
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cell]) continue;
      if (!ws[cell].s) ws[cell].s = {};

      // Base cell style
      ws[cell].s = {
        font: { sz: 11 },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };

      // Header row styling
      if (R === 0) {
        ws[cell].s.font = { bold: true, sz: 12 };
        ws[cell].s.fill = { fgColor: { rgb: 'CCCCCC' } };
        ws[cell].s.alignment.horizontal = 'center';
      }

      // Section header styling (Total Tickets, Status Distribution, etc.)
      if (ws[cell].v && typeof ws[cell].v === 'string' && 
          (ws[cell].v.includes('Distribution') || ws[cell].v === 'Total Tickets')) {
        ws[cell].s.font = { bold: true, sz: 12 };
        ws[cell].s.fill = { fgColor: { rgb: 'E6E6E6' } };
      }
    }
  }

  // Set column widths
  ws['!cols'] = [
    { width: 30, autofit: true },
    { width: 15, autofit: true }
  ];
};

// Create summary data for the second sheet
const createSummarySheet = (tickets) => {
  try {
    // Count tickets by status
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    // Count tickets by category
    const categoryCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    // Count tickets by priority
    const priorityCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    // Create summary data with section headers in bold
    const summaryData = [
      { 'Metric': 'Total Tickets', 'Count': tickets.length },
      { 'Metric': '', 'Count': '' },
      { 'Metric': 'Status Distribution', 'Count': '' },
      ...Object.entries(statusCounts).map(([status, count]) => ({
        'Metric': status,
        'Count': count
      })),
      { 'Metric': '', 'Count': '' },
      { 'Metric': 'Category Distribution', 'Count': '' },
      ...Object.entries(categoryCounts).map(([category, count]) => ({
        'Metric': category,
        'Count': count
      })),
      { 'Metric': '', 'Count': '' },
      { 'Metric': 'Priority Distribution', 'Count': '' },
      ...Object.entries(priorityCounts).map(([priority, count]) => ({
        'Metric': priority,
        'Count': count
      }))
    ];

    return summaryData;
  } catch (error) {
    console.error('Error creating summary sheet:', error);
    throw error;
  }
};

export default {
  createExcelWorkbook,
  formatCategoryName
}; 
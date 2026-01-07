
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { APP_NAME } from '../constants';

export const generateInvoice = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(APP_NAME, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Tax Invoice", pageWidth - 14, 22, { align: 'right' });

    // Line
    doc.setDrawColor(200);
    doc.line(14, 30, pageWidth - 14, 30);

    // Details
    doc.setFontSize(10);
    doc.setTextColor(40);

    // Left Column (Bill To)
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(order.shopOwner?.companyName || "Client", 14, 52);
    doc.text("ID: " + order.shopOwnerId, 14, 58);

    // Right Column (Invoice Info)
    const rightX = pageWidth - 60;
    doc.text(`Invoice #: ${order.invoiceNumber}`, rightX, 45);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightX, 52);
    doc.text(`Status: ${order.paymentStatus}`, rightX, 58);

    // Table
    const tableColumn = ["Item", "Unit Price", "Quantity", "Total"];
    const tableRows = [];

    order.items.forEach(item => {
        const itemData = [
            item.product?.name || "Product", // Handle populated or raw ID if needed
            `$${item.priceAtTimeOfOrder}`,
            item.quantity,
            `$${(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
    doc.text(`GST (18%): $${order.gst.toFixed(2)}`, pageWidth - 14, finalY + 7, { align: 'right' });
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${order.totalAmount.toFixed(2)}`, pageWidth - 14, finalY + 14, { align: 'right' });

    // Save
    doc.save(`Invoice_${order.invoiceNumber}.pdf`);
};

"""
Report Generation Service
Generates structured financial summaries, downloadable CSV exports,
and professional PDF reports using ReportLab.
"""

import io
import csv
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.finance import Transaction, Account, Budget, Goal, RecurringBill
from app.models.user import User

class ReportService:
    @staticmethod
    def generate_financial_summary_csv(db: Session, user: User) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["FinSense Financial Summary Report"])
        writer.writerow(["Generated At", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow(["User", user.full_name, user.email])
        writer.writerow(["Stated Monthly Income (INR)", f"₹{user.monthly_income:,.2f}"])
        writer.writerow([])

        # Accounts
        accounts = db.query(Account).filter(Account.user_id == user.id).all()
        writer.writerow(["--- ACCOUNTS & BALANCES ---"])
        writer.writerow(["Account Name", "Type", "Balance (INR)", "Primary"])
        for a in accounts:
            writer.writerow([a.name, a.account_type, f"₹{a.balance:,.2f}", a.is_primary])
        writer.writerow([])

        # Budgets
        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
        writer.writerow(["--- BUDGET ADHERENCE ---"])
        writer.writerow(["Category", "Period", "Budget Limit (INR)", "Total Expended (INR)", "Status"])
        for b in budgets:
            cat_name = b.category.name if b.category else f"Cat-{b.category_id}"
            spent = (
                db.query(Transaction)
                .filter(Transaction.user_id == user.id, Transaction.category_id == b.category_id, Transaction.transaction_type == "expense")
                .all()
            )
            tot = sum(t.amount for t in spent)
            status = "Overrun" if tot > b.limit_amount else "Within Cap"
            writer.writerow([cat_name, b.period, f"₹{b.limit_amount:,.2f}", f"₹{tot:,.2f}", status])
        writer.writerow([])

        # Transactions
        txs = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).all()
        writer.writerow(["--- RECENT TRANSACTIONS ---"])
        writer.writerow(["Date", "Description", "Merchant", "Category", "Type", "Amount (INR)", "Payment Method", "Anomaly Flag", "Anomaly Score"])
        for t in txs:
            cat_name = t.category.name if t.category else "Uncategorized"
            writer.writerow([
                t.date.strftime("%Y-%m-%d"),
                t.description,
                t.merchant or "",
                cat_name,
                t.transaction_type,
                f"₹{t.amount:,.2f}",
                t.payment_method,
                "YES" if t.is_anomaly else "NO",
                t.anomaly_score
            ])

        return output.getvalue()

    @staticmethod
    def generate_financial_summary_pdf(db: Session, user: User) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#1e293b"),
            fontName="Helvetica-Bold"
        )
        elements.append(Paragraph("FinSense — Comprehensive Financial Statement", title_style))
        elements.append(Spacer(1, 10))

        # Meta
        meta_text = (
            f"<b>Account Holder:</b> {user.full_name} &nbsp;|&nbsp; "
            f"<b>Email:</b> {user.email} &nbsp;|&nbsp; "
            f"<b>Generated:</b> {datetime.utcnow().strftime('%B %d, %Y')}"
        )
        elements.append(Paragraph(meta_text, styles['Normal']))
        elements.append(Spacer(1, 15))

        # Section: Accounts
        elements.append(Paragraph("<b>1. Liquid Account Balances</b>", styles['Heading3']))
        accounts = db.query(Account).filter(Account.user_id == user.id).all()
        acct_table_data = [["Account Name", "Type", "Balance (INR)", "Primary"]]
        for a in accounts:
            acct_table_data.append([a.name, a.account_type.title(), f"INR {a.balance:,.2f}", "Yes" if a.is_primary else "No"])

        acct_table = Table(acct_table_data, colWidths=[200, 100, 140, 80])
        acct_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        elements.append(acct_table)
        elements.append(Spacer(1, 15))

        # Section: Budgets
        elements.append(Paragraph("<b>2. Budget Allocation & Adherence</b>", styles['Heading3']))
        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
        budget_table_data = [["Category", "Allocated Limit", "Expended", "Utilization", "Status"]]
        for b in budgets:
            cat_name = b.category.name if b.category else f"Cat-{b.category_id}"
            spent = (
                db.query(Transaction)
                .filter(Transaction.user_id == user.id, Transaction.category_id == b.category_id, Transaction.transaction_type == "expense")
                .all()
            )
            tot = sum(t.amount for t in spent)
            pct = round((tot / max(1.0, b.limit_amount)) * 100, 1)
            status = "Breached" if tot > b.limit_amount else "Within Cap"
            budget_table_data.append([cat_name, f"INR {b.limit_amount:,.2f}", f"INR {tot:,.2f}", f"{pct}%", status])

        budget_table = Table(budget_table_data, colWidths=[150, 100, 100, 80, 90])
        budget_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        elements.append(budget_table)
        elements.append(Spacer(1, 15))

        # Section: Recent Transactions
        elements.append(Paragraph("<b>3. Recent Transactions Ledger</b>", styles['Heading3']))
        txs = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).limit(15).all()
        tx_table_data = [["Date", "Description", "Category", "Type", "Amount", "Anomaly"]]
        for t in txs:
            cat_name = t.category.name if t.category else "General"
            tx_table_data.append([
                t.date.strftime("%Y-%m-%d"),
                t.description[:25],
                cat_name[:15],
                t.transaction_type.title(),
                f"INR {t.amount:,.2f}",
                "FLAGGED" if t.is_anomaly else "Normal"
            ])

        tx_table = Table(tx_table_data, colWidths=[70, 150, 100, 60, 90, 60])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        elements.append(tx_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

report_service = ReportService()

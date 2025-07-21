# Copyright (c) 2025, khattab@info.com and contributors
# For license information, please see license.txt


import frappe
from frappe.utils import flt


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data






def execute(filters=None):
    columns = get_columns()
    data = []

    filters_dict = {}
    if filters.get("work_order"):
        filters_dict["name"] = filters.get("work_order")
    if filters.get("production_item"):
        filters_dict["production_item"] = filters.get("production_item")

    work_orders = frappe.get_all("Work Order", filters=filters_dict, fields=["name", "bom_no", "production_item", "qty"])

    for wo_doc in work_orders:
        wo = frappe.get_doc("Work Order", wo_doc.name)
        bom = frappe.get_doc("BOM", wo.bom_no)
        bom_items = {item.item_code: item for item in bom.items}

        for req_item in wo.required_items:
            bom_item = bom_items.get(req_item.item_code)
            standard_bom_qty = (bom_item.qty * flt(wo.qty)) if bom_item else 0

            transferred = flt(req_item.transferred_qty)
            consumed = flt(req_item.consumed_qty)
            difference = consumed - standard_bom_qty

            color = ""
            if difference > 0:
                color = "color: darkred; font-weight: bold;"
            elif difference < 0:
                color = "color: green; font-weight: bold;"

            data.append([
                wo.name,
                wo.production_item,
                wo.bom_no,
                f"<span style='{color}'>{req_item.item_code}</span>",
                flt(standard_bom_qty),
                flt(req_item.required_qty),
                transferred,
                consumed,
                difference
            ])

    return columns, data

def get_columns():
    return [
        {"label": "Work Order", "fieldtype": "Link", "options": "Work Order", "fieldname": "work_order", "width": 150},
        {"label": "Production Item", "fieldtype": "Link", "options": "Item", "fieldname": "production_item", "width": 150},
        {"label": "BOM", "fieldtype": "Link", "options": "BOM", "fieldname": "bom", "width": 150},
        {"label": "Raw Material", "fieldtype": "HTML", "fieldname": "item_code", "width": 150},
        {"label": "Standard BOM Qty", "fieldtype": "Float", "fieldname": "standard_bom_qty", "width": 120},
        {"label": "Required Qty", "fieldtype": "Float", "fieldname": "required_qty", "width": 120},
        {"label": "Transferred Qty", "fieldtype": "Float", "fieldname": "transferred_qty", "width": 120},
        {"label": "Consumed Qty", "fieldtype": "Float", "fieldname": "consumed_qty", "width": 120},
        {"label": "Difference", "fieldtype": "Float", "fieldname": "difference", "width": 120},
    ]
















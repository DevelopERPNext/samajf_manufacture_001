// Copyright (c) 2025, khattab@info.com and contributors
// For license information, please see license.txt







frappe.query_reports["Work Order Material Comparison"] = {
    "filters": [
        {
            "fieldname":"work_order",
            "label": "Work Order",
            "fieldtype": "Link",
            "options": "Work Order",
            "reqd": 0
        },
        {
            "fieldname":"production_item",
            "label": "Production Item",
            "fieldtype": "Link",
            "options": "Item",
            "reqd": 0
        }
    ]
}






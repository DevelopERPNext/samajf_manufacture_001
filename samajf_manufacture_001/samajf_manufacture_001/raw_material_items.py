# Copyright (c) 2024, Mahmoud Khattab
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

import json
from frappe.utils import flt


# from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry





@frappe.whitelist()
def create_print_msg(doc, method=None):
    frappe.msgprint(str("Raw Material Items has been created."), alert=True)
    # doc.reload()




@frappe.whitelist()
def activating_the_samajf_print_msg(doc, method=None):
    is_activated = frappe.db.get_single_value("samajf_single_001", "activating_the_samajf_manufacture_001_application")

    if is_activated:
        frappe.msgprint("✅ Application is Activated.", alert=True)
    else:
        frappe.msgprint("❌ Application is NOT Activated.", alert=True)

    # frappe.msgprint(str("Raw Material Items has been created."), alert=True)





#  ======= START Activating and Customizing Application Settings in Samajf Manufacture Module with Disabling Quantity Field in BOM Document ================

@frappe.whitelist()
def get_activation_settings():
    is_app_active = frappe.db.get_single_value("samajf_single_001", "activating_the_samajf_manufacture_001_application")
    is_quantity_deactivated = frappe.db.get_single_value("samajf_single_001", "deactivate_this_field_quantity_in_bom")

    return {
        "is_app_active": bool(is_app_active),
        "is_quantity_deactivated": bool(is_quantity_deactivated)
    }


#  ======= END Activating and Customizing Application Settings in Samajf Manufacture Module with Disabling Quantity Field in BOM Document ================










# ========================================================================
# ========================================================================







# ===============              master_2                ===================
# ========================================================================



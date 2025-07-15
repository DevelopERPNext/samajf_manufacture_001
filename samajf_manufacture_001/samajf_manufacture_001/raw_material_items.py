# Copyright (c) 2024, Mahmoud Khattab
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

import json
from frappe.utils import flt


from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry



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













# ==== START Fetch data from items table - A - Select Batch Method Update (6)   Raw Material Items_a_001 ====






#  =======  START  Class --- A_001  ============




# ========================================================================
# ========================================================================

#  ==== Fetch data from items table - Function to select batch and serial number ====


@frappe.whitelist()
def get_batch_data(item_code=None, warehouse=None, batch_id=None):
    conditions = []

    # Check if columns exist in the Batch table
    columns = frappe.db.sql("SHOW COLUMNS FROM `tabBatch`", as_dict=True)
    column_names = [col['Field'] for col in columns]

    if batch_id:
        conditions.append(f"batch_id = '{batch_id}'")

    if item_code and 'item_code' in column_names:
        conditions.append(f"item_code = '{item_code}'")

    if warehouse and 'warehouse' in column_names:
        conditions.append(f"warehouse = '{warehouse}'")

    condition_str = " AND ".join(conditions) if conditions else "1=1"

    # Query the Batch table
    query = f"""
        SELECT
            name AS batch_name,
            batch_id,
            batch_qty
        FROM `tabBatch`
        WHERE {condition_str}
    """

    result = frappe.db.sql(query, as_dict=True)
    return result
# =======================================

@frappe.whitelist()
def fetch_batch_numbers(item_code):
    filters = {'item': item_code}

    batches = frappe.get_all('Batch',
                             filters=filters,
                             fields=['batch_id', 'batch_qty'])
    return batches



# ========================================================================
# ========================================================================






#  ========  END  Class --- A_001  =============




# =======================================

@frappe.whitelist()
def fetch_batch_numbers(item_code):
    filters = {'item': item_code}

    batches = frappe.get_all('Batch',
                             filters=filters,
                             fields=['batch_id', 'batch_qty'])
    return batches



# ========================================================================
# ========================================================================


# =========   validate_qty_against_bom   =============








@frappe.whitelist()
def validate_qty_against_bom(bom_name, item_code, entered_qty, work_order=None):
	try:
		target_item_data = frappe.get_value(
			"BOM Item",
			{
				"parent": bom_name,
				"item_code": item_code
			},
			["qty", "uom", "stock_uom", "standard_deviation_raw_material_items_a_001"]
		)

		if not target_item_data:
			return {
				"valid": False,
				"message": _("Item {0} not found in BOM {1}").format(item_code, bom_name)
			}

		bom_qty, uom, stock_uom, deviation = target_item_data
		bom_qty = float(bom_qty or 0)
		deviation = float(deviation or 0)




		# Single Doctype
		if deviation == 0:
			deviation = frappe.db.get_single_value("samajf_single_001", "standard_deviation_global") or 0
			deviation = float(deviation)



		# frappe.msgprint(str(bom_name))
		# frappe.msgprint(str(item_code))
		# frappe.msgprint(str(target_item_data))
		# frappe.msgprint(str("-----------"))
		# frappe.msgprint(str(bom_qty))
		# frappe.msgprint(str("---------"))
		# frappe.msgprint(str(deviation))
		# frappe.msgprint(str("============"))



		# Work Order
		if not work_order:
			return {
				"valid": False,
				"message": _("Work Order not provided")
			}

		work_order_doc = frappe.get_doc("Work Order", work_order)
		required_item = next((i for i in work_order_doc.required_items if i.item_code == item_code), None)

		if not required_item:
			return {
				"valid": False,
				"message": _("Item {0} not found in Work Order {1}").format(item_code, work_order)
			}

		required_qty = float(required_item.required_qty or 0)
		entered_qty = float(entered_qty)


		max_allowed_qty = required_qty + (required_qty * deviation / 100)
		min_allowed_qty = required_qty - (required_qty * deviation / 100)

		if entered_qty > max_allowed_qty or entered_qty < min_allowed_qty:
			return {
				"valid": False,
				"message": _("Quantity {0} is outside allowed range [{1} - {2}] {3}").format(
					entered_qty,
					round(min_allowed_qty, 3),
					round(max_allowed_qty, 3),
					uom or stock_uom or "Unit"
				),
				"max_allowed": max_allowed_qty,
				"min_allowed": min_allowed_qty
			}


		# frappe.msgprint(str("******************"))
		# frappe.msgprint(str(max_allowed_qty))
		# frappe.msgprint(str("-----------------"))
		# frappe.msgprint(str(min_allowed_qty))
		# frappe.msgprint(str("******************"))


		return {
			"valid": True,
			"message": _("Quantity is within allowed limits"),
			"max_allowed": max_allowed_qty,
			"min_allowed": min_allowed_qty
		}

	except Exception as e:
		frappe.log_error(f"Error in validate_qty_against_bom: {str(e)}")
		return {
			"valid": False,
			"message": _("Validation error: {0}").format(str(e))
		}




# ========================================================================
# ========================================================================





# ==== END Fetch data from items table - A - Select Batch Method Update (6)   Raw Material Items_a_001 ====











# ========================================================================
# ========================================================================








# ========================================================================
# ========================================================================








# ========================================================================
# ========================================================================









# ========================================================================
# ========================================================================








# ===============              master_4                ===================
# ========================================================================



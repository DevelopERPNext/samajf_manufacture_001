


// ======= START Activating and Customizing Application Settings in Samajf Manufacture Module with Disabling Quantity Field in BOM Document ================

frappe.ui.form.on('BOM', {
    setup: function(frm) {
        frappe.call({
            method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.get_activation_settings',
            callback: function(r) {
                if (!r.message) return;

                const { is_app_active, is_quantity_deactivated } = r.message;

                if (is_app_active) {
                    if (is_quantity_deactivated) {
                        frm.set_df_property("quantity", "read_only", 1);
                    }
                }
            }
        });
    },

    refresh: function(frm) {
        frappe.call({
            method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.get_activation_settings',
            callback: function(r) {
                if (!r.message) return;

                const { is_app_active, is_quantity_deactivated } = r.message;

                if (is_app_active && is_quantity_deactivated) {
                    frm.set_df_property("quantity", "read_only", 1);
                }
            }
        });
    }
});


// ======= END Activating and Customizing Application Settings in Samajf Manufacture Module with Disabling Quantity Field in BOM Document ================














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



















//   ================================================================
//   ================================================================
//   ==== START  Fetch data from items table - A - Select Batch Method Update (6)   Raw Material Items_a_001  ====





//  04AA6D
//  005700
//  4e4e4e
//  563627
//  030824



frappe.ui.form.on('Stock Entry', {
    refresh: function(frm) {

    //    if (frm.doc.docstatus === 0 && frm.doc.stock_entry_type === 'Material Transfer for Manufacture' && frm.doc.bom_check === 0) {
//    if (frm.doc.docstatus === 0 && frm.doc.stock_entry_type === 'Material Transfer for Manufacture' || frm.doc.stock_entry_type === 'Material Transfer') {
    if (frm.doc.docstatus === 0 && frm.doc.stock_entry_type === 'Material Transfer for Manufacture') {
        frm.add_custom_button(__('Select Batch Method (6) RM'), function() {
            open_item_dialog_aa(frm);
        }).addClass('btn-warning').css({
                'color': 'white',
                'font-weight': 'bold',
                'background-color': '#030824'
        });
        }
    },


});

function open_item_dialog_aa(frm) {
    let d = new frappe.ui.Dialog({
        title: 'Select Item and Scan Batch Numbers',
        fields: [
            {
                label: 'Item Code',
                fieldname: 'item_code',
                fieldtype: 'Select',
                options: frm.doc.items.map(item => item.item_code),
                reqd: 1
            },
            {
                label: 'Warehouse',
                fieldname: 'warehouse',
                fieldtype: 'Select',
                options: [],
                hidden: 1,
                reqd: 1
            },
            {
                label: 'Scan Batch No',
                fieldname: 'batch_no',
                fieldtype: 'Select',
                options: [],
                hidden: 1,
                reqd: 0
            }
        ],
        primary_action_label: 'Fetch Quantity',
        primary_action(values) {

            fetch_quantity_aa_rm_6(frm, values.item_code, values.warehouse, values.batch_no);
//            fetch_batch_data(values.item_code, values.warehouse, values.batch_no).then(() => {
//                frappe.msgprint(__('Batch data fetched successfully'));
//            }).catch(err => {
//                frappe.msgprint(__('Error fetching batch data: ') + err.message);
//            });
            d.hide();
        }
    });

    d.fields_dict.item_code.$input.on('change', function() {
        let selected_item_code = d.get_value('item_code');
        let warehouse_field = d.fields_dict.warehouse;
        let batch_no_field = d.fields_dict.batch_no;

        // Fetch warehouses based on the selected item code
        let warehouses = frm.doc.items
            .filter(item => item.item_code === selected_item_code)
            .map(item => item.s_warehouse || item.t_warehouse);

        // Update warehouse field options
        let unique_warehouses = [...new Set(warehouses)];
        warehouse_field.df.options = unique_warehouses.join('\n');

        // Set default value to the first option if available
        if (unique_warehouses.length > 0) {
            d.set_value('warehouse', unique_warehouses[0]);
        }

        warehouse_field.refresh();


        // Fetch batch numbers based on the selected item code and warehouse
        fetch_batch_numbers_aa_rm_6(selected_item_code).then(batches => {
            // Format batch options to include batch_id and batch_qty
            let batch_options = batches.map(batch => `${batch.batch_id} (Qty: ${batch.batch_qty})`).join('\n');

            // Update batch_no field options
            batch_no_field.df.options = batch_options;
            batch_no_field.refresh();
        }).catch(err => {
            frappe.msgprint(__('Error fetching batch numbers: ') + err.message);
        });
    });

    d.show();
}

function fetch_batch_numbers_aa_rm_6(item_code) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.fetch_batch_numbers',
            args: {
                item_code: item_code
            },
            callback: function(r) {
                if (r.message) {
                    resolve(r.message);
                } else {
                    resolve([]);
                }
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

function fetch_batch_data_aa_rm_6(item_code, warehouse, batch_id) {
    frappe.call({
        method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.get_batch_data',
        args: {
            item_code: item_code,
            warehouse: warehouse,
            batch_id: batch_id
        },
        callback: function(r) {
            if (r.message) {
                // Format the batch data into a string
                let batch_data_str = r.message.map(batch => {
                    return `Name: ${batch.batch_name}, Batch ID: ${batch.batch_id}, Batch Quantity: ${batch.batch_qty}`;
                }).join('\n');

//                // Display the batch data using frappe.msgprint
//                frappe.msgprint({
//                    title: __('Batch Details'),
//                    indicator: 'green',
//                    message: `<pre>${batch_data_str}</pre>`
//                });
            } else {
                frappe.msgprint(__('No batch data found.'));
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error retrieving batch data: ') + err.message);
        }
    });
}

function fetch_quantity_aa_rm_6(frm, item_code, warehouse, batch_no) {
    // Find the item in the items table
    let item = frm.doc.items.find(i => i.item_code === item_code);

    if (item) {
        // Fetch batch and serial number details
        select_batch_and_serial_no_aa_rm_6(frm, item, warehouse, batch_no).then(() => {
//            frappe.msgprint(__('Batch and serial number details fetched successfully'));
        }).catch(err => {
            frappe.msgprint(__('Error fetching batch and serial number details: ') + err.message);
        });
    } else {
        frappe.msgprint(__('Item not found in the table'));
    }
}

function select_batch_and_serial_no_aa_rm_6(frm, item, warehouse, batch_no) {
    return new Promise((resolve, reject) => {
        frappe.db.get_value("Item", item.item_code, ["has_batch_no", "has_serial_no"]).then((r) => {
            if (r.message && (r.message.has_batch_no || r.message.has_serial_no)) {
                item.has_serial_no = r.message.has_serial_no;
                item.has_batch_no = r.message.has_batch_no;
                item.type_of_transaction = item.s_warehouse ? "Outward" : "Inward";

                new erpnext.BatchPackageSelectorAA_RM_6(frm, item, (r) => {
                    if (r) {
                        frappe.model.set_value(item.doctype, item.name, {
                            serial_and_batch_bundle: r.name,
                            use_serial_batch_fields: 0,
                            basic_rate: r.avg_rate,
                            qty: Math.abs(r.total_qty) / flt(item.conversion_factor || 1, precision("conversion_factor", item)),
                        });
                        resolve();
                    } else {
                        reject(new Error('Failed to fetch serial and batch package details'));
                    }
                });
            } else {
                reject(new Error('Item does not have batch or serial numbers'));
            }
        }).catch(err => {
            reject(err);
        });
    });
}







//------------------------------------------------------------------------------------------
// =============  Class  Define the BatchPackageSelector class Raw Material Items_a_001 (6) ================
//------------------------------------------------------------------------------------------




erpnext.BatchPackageSelectorAA_RM_6 = class BatchPackageSelector {
    constructor(frm, item, callback) {
        this.frm = frm;
        this.item = item;
        this.qty = item.qty;
        this.callback = callback;
        this.bundle = this.item?.is_rejected
            ? this.item.rejected_serial_and_batch_bundle
            : this.item.serial_and_batch_bundle;

        this.make();
        this.render_data();
    }




    make() {
        let label = __("Batch Nos");
        let primary_label = this.bundle ? __("Update") : __("Add");
        primary_label += " " + label;

        this.dialog = new frappe.ui.Dialog({
            title: this.item?.title || primary_label,
            fields: this.get_dialog_fields(),
            primary_action_label: primary_label,
            primary_action: () => this.update_bundle_entries(),
            secondary_action_label: __("Edit Full Form (*)"),
            secondary_action: () => this.edit_full_form(),
            on_form_render: () => {
                // Trigger initial calculation when the dialog is rendered
                this.get_calc_qty_info();

                // Attach event handlers
                this.dialog.get_field("qty").df.onchange = () => this.get_calc_qty_info();
                this.dialog.get_field("scan_batch_no").df.onchange = () => this.get_calc_qty_info();
                this.dialog.get_field("entries").grid.on("data-change", () => this.get_calc_qty_info());


                // Ensure the Enter key doesn't trigger form submission
                this.dialog.get_field("scan_batch_no").$input.off('keydown').on('keydown', function(e) {
                    if (e.which === 13) {
                        e.preventDefault();
                    }
                });


            }


        });


        this.dialog.get_field("scan_batch_no").$input.off('keydown').on('keydown', function(e) {
                    if (e.which === 13) {
                        e.preventDefault();
                    }
        });


        this.dialog.show();

        // Initialize fields
        let qty = this.item.stock_qty || this.item.transfer_qty || this.item.qty;

        if (this.item?.is_rejected) {
            qty = this.item.rejected_qty;
        }

        qty = Math.abs(qty);
        if (qty > 0) {
            this.dialog.set_value("qty", qty).then(() => {
                if (this.item.batch_no && !this.item.serial_and_batch_bundle) {
                    this.dialog.set_value("scan_batch_no", this.item.batch_no);
                    frappe.model.set_value(this.item.doctype, this.item.name, "batch_no", "");
                }

                this.dialog.fields_dict.entries.grid.refresh();
            });
        }
    }




    get_dialog_fields() {
        let fields = [
            {
                fieldtype: "Data",
                options: "Barcode",
                fieldname: "scan_batch_no",
                label: __("Scan Batch No"),
//                onchange: () => this.scan_barcode_data(),
                onchange: () => {
                    this.scan_barcode_data();
                    this.update_difference_qty();
                    this.update_difference_qty_2();
                    this.update_difference_qty_3();
                },
            },

            {
                fieldtype: "Link",
                fieldname: "warehouse",
                label: __("Warehouse"),
                read_only: 1,
                options: "Warehouse",
                default: this.get_warehouse(),
                onchange: () => {
                    this.item.warehouse = this.dialog.get_value("warehouse");
                    this.get_auto_data();
                },
                get_query: () => {
                    return {
                        filters: {
                            is_group: 0,
                            company: this.frm.doc.company,
                        },
                    };
                },
            },



//            {
//                fieldtype: "Float",
//                fieldname: "qty",
//                label: __("Qty to Fetch"),
////                onchange: () => this.get_auto_data(),
//                onchange: () => {
//                    this.get_auto_data();
//                    this.update_difference_qty();
//                    this.update_difference_qty_2();
//                    this.update_difference_qty_3();
//                },
////                read_only: 1
//                read_only: 0
//            },






			{
				fieldtype: "Float",
				fieldname: "qty",
				label: __("Qty to Fetch"),
				read_only: 0,
				onchange: async () => {
					const item_code = this.item?.item_code;
					const bom_name = this.frm?.doc?.bom_no;
					const entered_qty = parseFloat(this.dialog.get_value('qty')) || 0;

//					const work_order = this.frm?.doc?.work_order || this.frm?.doc?.work_order_no;
					const work_order = this.frm.doc.work_order;



					if (!item_code || !bom_name) {
						frappe.msgprint(__('يرجى تحديد كود الصنف و BOM No أولاً'));
						return;
					}

					try {
						const r = await frappe.call({
							method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.validate_qty_against_bom',
							args: {
								bom_name: bom_name,
								item_code: item_code,
								entered_qty: entered_qty,
								work_order: work_order
							}
						});

						const result = r.message;

						if (!result.valid) {
							frappe.msgprint({
								title: __('Validation Error'),
								message: __(result.message),
								indicator: 'red'
							});

							this.dialog.set_value('qty', result.max_allowed);
							return;
						}

						this.get_auto_data();
						this.update_difference_qty();
						this.update_difference_qty_2();
						this.update_difference_qty_3();

					} catch (err) {
						console.error("Error validating qty:", err);
						frappe.msgprint(__('حدث خطأ أثناء التحقق من الكمية'));
					}
				}
			},





            {
                fieldtype: "Column Break",
            },

            {
                fieldtype: 'Float',
                fieldname: 'calc_qty',
                label: __('Calc Qty'),
//                onchange: () => this.get_auto_data(),
                onchange: () => {
                    this.get_auto_data();
                    this.update_difference_qty();
                    this.update_difference_qty_2();
                    this.update_difference_qty_3();
                },
                read_only: 1
            },
            {
                fieldtype: 'Button',
                fieldname: 'remove_all_data_table',
                label: __('Remove All Data Table'),
                click: () => this.clear_all_entries(),
            },
            {
                fieldtype: 'Float',
                fieldname: 'difference_qty',
                label: __('Difference Qty'),
                read_only: 1,
            },
            {
                fieldtype: 'Float',
                fieldname: 'difference_qty_2',
                label: __('Difference Qty 2'),
                read_only: 0,
                hidden: 1,
            },
            {
                fieldtype: 'Float',
                fieldname: 'difference_qty_the_last_child',
                label: __('Difference Qty The Last Child'),
                read_only: 0,
                hidden: 1,
            },
            {
                fieldtype: 'Float',
                fieldname: 'update_qty_the_last_child',
                label: __('Update Qty The Last Child Manual'),
                read_only: 0,
                hidden: 1,
//                onchange: () => this.update_last_child_qty()
                onchange: () => {
                    this.update_last_child_qty();
                    this.update_difference_qty();
                    this.update_difference_qty_2();
                    this.update_difference_qty_3();
                },
            },

            {
                fieldtype: 'Button',
                fieldname: 'update_difference_qty_2_button',
                label: __('Automatically Update the Difference Quantity'),
                click: () => {
                    this.update_difference_qty_change();
                    this.update_difference_qty();
                    this.update_last_child_qty();
                    this.update_last_child_qty_2();
                    this.calculate_qty();

                },
//                click: () => this.update_difference_qty_2(),
//                read_only: 1,
            },

            {
                fieldtype: "Section Break",
            },
            {
                fieldname: "entries",
                fieldtype: "Table",
//                allow_bulk_edit: true,
                allow_bulk_edit: false,
                data: [],
//                fields: this.get_dialog_table_fields(),
                fields: this.get_dialog_table_fields().map(field => {
                    field.read_only = true;
                    return field;
                }),
//                onchange: () => {
//                    this.update_difference_qty();
//                    this.update_difference_qty_2();
//                },
                onload: () => {
                    this.setup_table_change_listeners();
                }

            }

        ];

        return fields;
    }




            //  Method to set up change listeners
            setup_table_change_listeners() {
                let table = this.dialog.get_field('entries').grid;

                table.fields.forEach(field => {
                    field.$input.on('change', () => {
                        this.update_difference_qty();
                        this.update_difference_qty_2();
                        this.update_difference_qty_3();
                    });
                });
            }


    calculate_qty() {
        let total_qty = 0;
        const rows = this.dialog.get_field("entries").grid.get_data();
        rows.forEach(row => {
            total_qty += row.qty || 0;
        });
//        frappe.msgprint("Total Quantity Calculated: " + total_qty);
        this.dialog.set_value("calc_qty", total_qty);


        // Check if calc_qty matches qty
        const qty_to_fetch = this.dialog.get_value("qty");
        if (total_qty === qty_to_fetch) {
            frappe.show_alert({
                message: __('The calculated quantity matches the required quantity.'),
                indicator: 'green'
            });
        } else {
            frappe.show_alert({
                message: __('The calculated quantity does not match the required quantity.'),
                indicator: 'red'
            });
        }

        this.update_difference_qty_2();
        this.update_difference_qty_3();

    }






    update_last_child_qty() {
        const new_qty = this.dialog.get_value('update_qty_the_last_child');

        if (new_qty !== null && new_qty !== undefined) {
            let entries = this.dialog.get_field('entries').grid.get_data();

            if (entries.length > 0) {
                let last_row = entries[entries.length - 1];
                last_row.qty = new_qty;
                this.dialog.get_field('entries').grid.refresh();
            }

            this.calculate_qty();
            this.update_difference_qty();
            this.update_difference_qty_2();
            this.update_difference_qty_3();
        }
    }





    update_last_child_qty_2() {
        let new_qty = parseFloat(this.dialog.get_value('difference_qty')) || 0;

        let entries = this.dialog.get_field('entries').grid.get_data();

        if (entries.length > 0) {
            let last_row = entries[entries.length - 1];
            last_row.qty = new_qty;

            this.dialog.get_field('entries').grid.refresh();
        }


        const qty = parseFloat(this.dialog.get_value('qty')) || 0;
        const calc_qty = parseFloat(this.dialog.get_value('calc_qty')) || 0;
        const difference_qty = calc_qty - qty;

//        this.dialog.set_value('difference_qty', difference_qty);
        this.dialog.set_value('difference_qty', 0);
        this.dialog.get_field('difference_qty').refresh();

    }






    update_difference_qty_change() {
        const difference_qty = parseFloat(this.dialog.get_value('difference_qty')) || 0;

        if (difference_qty <= 0) {
            frappe.msgprint("Negative or Zero Value")
        }

    }




    clear_all_entries() {
        let table_field = this.dialog.get_field('entries');
        table_field.df.data = [];
        table_field.grid.refresh();

        this.calculate_qty();
        this.update_difference_qty();
        this.update_difference_qty_2();
        this.update_difference_qty_3();
    }







      update_difference_qty() {
            const qty_to_fetch = parseFloat(this.dialog.get_value('qty')) || 0;
            const calc_qty = parseFloat(this.dialog.get_value('calc_qty')) || 0;
            const diff_qty = parseFloat(this.dialog.get_value('difference_qty_the_last_child')) || 0;

    //        const difference = qty_to_fetch - calc_qty;
//            const difference = ( calc_qty - qty_to_fetch );

            const difference_var = ( calc_qty - qty_to_fetch );
            const difference = ( diff_qty - difference_var );

            this.dialog.set_value('difference_qty', difference);
        }



    update_difference_qty_2() {
//        const calc_difference_qty = parseFloat(this.dialog.get_value('difference_qty')) || 0;
//        const calc_qty = parseFloat(this.dialog.get_value('calc_qty')) || 0;

        let entries = this.dialog.get_field('entries').grid.get_data();
        let total_qty = 0;

        if (entries.length > 0) {
            total_qty = entries.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);
        }

        this.dialog.set_value('difference_qty_2', total_qty);

    }








    update_difference_qty_3() {
//        const calc_difference_qty = parseFloat(this.dialog.get_value('difference_qty')) || 0;
//        const calc_qty = parseFloat(this.dialog.get_value('calc_qty')) || 0;


        let entries = this.dialog.get_field('entries').grid.get_data();

        let last_qty = 0;

        if (entries.length > 0) {
            last_qty = parseFloat(entries[entries.length - 1].qty) || 0;
        }

        this.dialog.set_value('difference_qty_the_last_child', last_qty);

    }



    get_dialog_table_fields() {
        return [
            {
                fieldtype: "Link",
                options: "Batch",
                fieldname: "batch_no",
                label: __("Batch No"),
                in_list_view: 1,
                get_query: () => {
                    let is_inward = false;
                    if (
                        (["Purchase Receipt", "Purchase Invoice"].includes(this.frm.doc.doctype) &&
                            !this.frm.doc.is_return) ||
                        (this.frm.doc.doctype === "Stock Entry" &&
                            this.frm.doc.purpose === "Material Receipt")
                    ) {
                        is_inward = true;
                    }

                    return {
                        query: "erpnext.controllers.queries.get_batch_no",
                        filters: {
                            item_code: this.item.item_code,
                            warehouse: this.item.s_warehouse || this.item.t_warehouse || this.item.warehouse,
                            is_inward: is_inward,
                        },
                    };
                },
                onchange: () => {
                    this.fetch_batch_data_aaa();
                    this.calculate_qty();

//                    this.update_difference_qty();
//                    this.update_difference_qty_2();
                },
            },
            {
                fieldtype: "Float",
                fieldname: "qty",
                label: __("Quantity - Total"),
                in_list_view: 1,
                default: 0,
                onchange: () => {
                    this.calculate_qty();
                    this.update_difference_qty();
                    this.update_difference_qty_2();
                    this.update_difference_qty_3();
                }

            },
            {
                fieldtype: "Data",
                fieldname: "name",
                label: __("Name"),
                hidden: 0,
            },
        ];
    }



    fetch_batch_data_aaa() {
        const { batch_no, warehouse } = this.dialog.get_values();
        if (batch_no) {
            frappe.call({
                method: 'samajf_manufacture_001.samajf_manufacture_001.raw_material_items.get_batch_data',
                args: {
                    item_code: this.item.item_code,
                    warehouse: warehouse || this.item.warehouse || this.item.s_warehouse,
                    batch_id: batch_no
                },
                callback: function(r) {
                    if (r.message) {
                        // Format the batch data into a string
                        let batch_data_str = r.message.map(batch => {
                            return `Name: ${batch.batch_name}, Batch ID: ${batch.batch_id}, Batch Quantity: ${batch.batch_qty}`;
                        }).join('\n');

                        // Display the batch data using frappe.msgprint
                        frappe.msgprint({
                            title: __('Batch Details'),
                            indicator: 'green',
                            message: `<pre>${batch_data_str}</pre>`
                        });
                    } else {
                        frappe.msgprint(__('No batch data found.'));
                    }
                },
                error: function(err) {
                    frappe.msgprint(__('Error retrieving batch data: ') + err.message);
                }
            });
        }
    }

    get_auto_data() {
        let { qty, based_on } = this.dialog.get_values();

        if (this.item.serial_and_batch_bundle || this.item.rejected_serial_and_batch_bundle) {
            if (this.qty && qty === Math.abs(this.qty)) {
                return;
            }
        }

        if (this.item.batch_no) {
            return;
        }

        if (!based_on) {
            based_on = "FIFO";
        }

        if (qty) {
            frappe.call({
                method: "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle.get_auto_data",
                args: {
                    item_code: this.item.item_code,
                    warehouse: this.item.warehouse || this.item.s_warehouse,
                    has_batch_no: this.item.has_batch_no,
                    qty: qty,
                    based_on: based_on,
                },
                callback: (r) => {
                    if (r.message) {
                        this.dialog.fields_dict.entries.df.data = r.message;
                        this.dialog.fields_dict.entries.grid.refresh();
                    }
                },
            });
        }
    }





    scan_barcode_data() {
    const { scan_batch_no } = this.dialog.get_values();

        if (scan_batch_no) {
            frappe.call({
                method: "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle.is_serial_batch_no_exists",
                args: {
                    item_code: this.item.item_code,
                    type_of_transaction: this.item.type_of_transaction,
                    batch_no: scan_batch_no,
                },
                callback: (r) => {
////                    this.update_batch_no();
                    this.update_batch_no_bb();
////                    this.fetch_batch_qty(scan_batch_no, warehouse);
                },
            });
        }

        this.calculate_qty();
    }

    fetch_batch_qty(batch_no, warehouse) {
        frappe.call({
            method: "erpnext.stock.doctype.batch.batch.get_batch_qty",
            args: {
                batch_no: batch_no,
                warehouse: warehouse || this.item.warehouse || this.item.s_warehouse,
            },
            callback: (res) => {
                if (res.message) {
                    let batch_qty = res.message;
                    let entries = this.dialog.fields_dict.entries.df.data;
                    let existing_entry = entries.find((entry) => entry.batch_no === batch_no);

                    if (existing_entry) {
                        existing_entry.qty = batch_qty;
                    } else {
                        entries.push({
                            batch_no: batch_no,
                            qty: batch_qty,
                        });
                    }

                    this.dialog.fields_dict.entries.grid.refresh();
                    this.dialog.fields_dict.scan_batch_no.set_value("");
                } else {
                    frappe.msgprint(__('No quantity found for the batch.'));
                }
            },
        });
    }






    update_batch_no_bb() {
        const { scan_batch_no, warehouse } = this.dialog.get_values();

        if (scan_batch_no) {
            frappe.call({
                method: "erpnext.stock.doctype.batch.batch.get_batch_qty",
                args: {
                    batch_no: scan_batch_no,
                    warehouse: warehouse || this.item.warehouse || this.item.s_warehouse,
                },
                callback: (res) => {
                    if (res.message) {
                        let batch_qty = res.message;
                        let entries = this.dialog.fields_dict.entries.df.data;
                        let existing_entry = entries.find((entry) => entry.batch_no === scan_batch_no);

                        if (existing_entry) {
//                            frappe.msgprint(__('Batch No already exists in the table.'));

                            frappe.show_alert({
                                message: __('Batch No already exists in the table.'),
                                indicator: 'red'
                            });

                            this.dialog.fields_dict.scan_batch_no.set_value("");
                        } else {
                            entries.push({
                                batch_no: scan_batch_no,
                                qty: batch_qty,
                            });

                            this.dialog.fields_dict.entries.grid.refresh();
                            this.dialog.fields_dict.scan_batch_no.set_value("");
                        }
                    } else {
//                        frappe.msgprint(__('No quantity found for the batch.'));
                        frappe.show_alert({
                                message: __('No quantity found for the batch.'),
                                indicator: 'red'
                        });
                    }
                },
            });
        }
    }




    update_batch_no() {
        const { scan_batch_no } = this.dialog.get_values();

        if (scan_batch_no) {
            let existing_row = this.dialog.fields_dict.entries.df.data.filter((d) => {
                if (d.batch_no === scan_batch_no) {
                    return d;
                }
            });

            if (existing_row?.length) {
                existing_row[0].qty += 1;
            } else {
                this.dialog.fields_dict.entries.df.data.push({
                    batch_no: scan_batch_no,
                    qty: 1,
                });
            }

            this.dialog.fields_dict.scan_batch_no.set_value("");
        }

        this.dialog.fields_dict.entries.grid.refresh();
    }





    update_bundle_entries() {
        let entries = this.dialog.get_values().entries;
        let warehouse = this.dialog.get_value("warehouse");

        if ((entries && !entries.length) || !entries) {
            frappe.throw(__("Please add at least one Batch No"));
        }

        if (!warehouse) {
            frappe.throw(__("Please select a Warehouse"));
        }

        // Calculate total quantity
        let total_qty = 0;
        entries.forEach(row => {
            total_qty += row.qty || 0;
        });

        // Get the value of qty to fetch
        const qty_to_fetch = this.dialog.get_value("qty");

        // Check if calc_qty matches qty_to_fetch
        if (total_qty !== qty_to_fetch) {
            frappe.show_alert({
                message: __('The calculated quantity does not match the required quantity.'),
                indicator: 'red'
            });
            return;
        } else {
            frappe.show_alert({
                message: __('The calculated quantity matches the required quantity.'),
                indicator: 'green'
            });
        }

        frappe
            .call({
                method: "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle.add_serial_batch_ledgers",
                args: {
                    entries: entries,
                    child_row: this.item,
                    doc: this.frm.doc,
                    warehouse: warehouse,
                },
            })
            .then((r) => {
                this.callback && this.callback(r.message);
                this.frm.save();
                this.dialog.hide();
            });
    }




    edit_full_form() {
        let bundle_id = this.item.serial_and_batch_bundle;
        if (!bundle_id) {
            let _new = frappe.model.get_new_doc("Serial and Batch Bundle", null, null, true);

            _new.item_code = this.item.item_code;
            _new.warehouse = this.get_warehouse();
            _new.has_batch_no = this.item.has_batch_no;
            _new.type_of_transaction = this.item.type_of_transaction;
            _new.company = this.frm.doc.company;
            _new.voucher_type = this.frm.doc.doctype;
            bundle_id = _new.name;
        }

        frappe.set_route("Form", "Serial and Batch Bundle", bundle_id);
        this.dialog.hide();
    }

    get_warehouse() {
        return this.item?.type_of_transaction === "Outward"
            ? this.item.warehouse || this.item.s_warehouse
            : this.item.warehouse || this.item.t_warehouse;
    }

    render_data() {
        if (this.bundle || this.frm.doc.is_return) {
            frappe
                .call({
                    method: "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle.get_serial_batch_ledgers",
                    args: {
                        item_code: this.item.item_code,
                        name: this.bundle,
                        voucher_no: !this.frm.is_new() ? this.item.parent : "",
                        child_row: this.frm.doc.is_return ? this.item : "",
                    },
                })
                .then((r) => {
                    if (r.message) {
                        this.set_data(r.message);
                    }
                });
        }
    }

    set_data(data) {
        data.forEach((d) => {
            d.qty = Math.abs(d.qty);
            d.name = d.child_row || d.name;
            this.dialog.fields_dict.entries.df.data.push(d);
        });

        this.dialog.fields_dict.entries.grid.refresh();
    }

    fetch_batch_qty() {
        const { batch_no, warehouse } = this.dialog.get_values();
        if (batch_no) {
            frappe.call({
                method: "erpnext.stock.doctype.batch.batch.get_batch_qty",
                args: {
                    batch_no: batch_no,
                    warehouse: warehouse || this.item.warehouse || this.item.s_warehouse,
                },
                callback: (res) => {
                    if (res.message) {
                        let batch_qty = res.message;
                        let entries = this.dialog.fields_dict.entries.df.data;
                        let existing_entry = entries.find((entry) => entry.batch_no === batch_no);

                        if (existing_entry) {
                            existing_entry.qty = batch_qty;
                        } else {
                            entries.push({
                                batch_no: batch_no,
                                qty: batch_qty,
                            });
                        }

                        this.dialog.fields_dict.entries.grid.refresh();
                    }
                },
            });
        }
    }
};






//   ==== END Fetch data from items table - A - Select Batch Method Update (6)   Raw Material Items_a_001 ====
// ===============================================================
// ===============================================================











































// ==============================================================
// ==============================================================
// ==============================================================
// ==============================================================





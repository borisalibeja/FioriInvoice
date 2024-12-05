 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
    
],
function (Controller, JSONModel, MessageBox, Filter, FilterOperator) {
    "use strict";
 
    return Controller.extend("trial4.controller.Chart", {

        onInit: function () {
            // Attach route pattern matched to update the i18n model dynamically
            this.getOwnerComponent().getRouter()
                .getRoute("RouteChart")
                .attachPatternMatched(this._onRouteMatched, this);
            this._callToDB();
        },

        _onRouteMatched: function () {
            // Refresh the i18n model when this route is matched
            let oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }
        },

        onPress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onShowChart: function () {
            const fromDate = this.getView().byId("fromDate").getDateValue();
            const toDate = this.getView().byId("toDate").getDateValue();
            const timeDivision = this.getView().byId("timeDivisionDropdown").getSelectedKey();
            const oModel = this.getView().getModel("invoiceModel");

            if (!oModel) {
                MessageBox.error("Invoice model is not available. Please ensure data is loaded correctly.");
                return;
            }

            const oData = oModel.getData();
            if (!fromDate || !toDate || !timeDivision) {
                MessageBox.error("Please set all filters before submitting.");
                return;
            }

            const filteredData = oData.filter(item => {
                const invDate = new Date(item.Invdate);
                return invDate >= fromDate && invDate <= toDate;
            });

            if (filteredData.length === 0) {
                MessageBox.warning("No data available for the selected time frame.");
                return;
            }

            const chartData = this._generateChartData(filteredData, timeDivision);
            this._displayChart(chartData);
        },

        _getAppModulePath: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            return jQuery.sap.getModulePath(appId.replaceAll(".", "/"));
        },

        _callToDB: function () {
            const appModulePath = this._getAppModulePath();
            const oModel = new JSONModel();

            $.ajax({
                url: `${appModulePath}/odata/sap/opu/odata/sap/ZFIORI_INVOICE_PROJECT_SRV/zfiori_invoice_typeSet`,
                type: "GET",
                dataType: "json",
                headers: { "X-CSRF-Token": "Fetch" },
                success: (data, textStatus, jqXHR) => {
                    oModel.setData(data.d.results); // Store fetched data
                    this.getView().setModel(oModel, "invoiceModel");
                },
                error: (err) => {
                    MessageBox.error("Error loading data: " + err.statusText);
                }
            });
        },
        _displayChart: function (data) {
            this.chartData = data; // Store data for navigation
            this.currentIndex = 0; // Reset navigation index
            this._updateChart();
        },

        _updateChart: function () {
            const salesChart = this.getView().byId("salesChart");
            salesChart.removeAllColumns();

            const columns = this.chartData.slice(this.currentIndex, this.currentIndex + 4);
            columns.forEach(segment => {
                salesChart.addColumn(new sap.suite.ui.microchart.ColumnMicroChartData({
                    label: segment.label,
                    value: segment.value,
                    color: segment.color
                }));
            });
        },
        onNavigateForward: function () {
            if (this.currentIndex + 4 < this.chartData.length) {
                this.currentIndex += 4;
                this._updateChart();
            }
        },

        onNavigateBack: function () {
            if (this.currentIndex - 4 >= 0) {
                this.currentIndex -= 4;
                this._updateChart();
            }
        },

        _generateChartData: function (data, division) {
            const sales = [];
            const dateGroups = {};

            data.forEach(item => {
                const dateKey = this._getDateKey(item.Invdate, division);
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = 0;
                }
                dateGroups[dateKey]++;
            });

            Object.keys(dateGroups).forEach((key, index) => {
                sales.push({
                    label: key,
                    value: dateGroups[key],
                    color: index % 2 === 0 ? "Good" : "Neutral"
                });
            });

            return sales;
        },
        _getDateKey: function (date, division) {
            const d = new Date(date);
            switch (division) {
                case "day":
                    return d.toLocaleDateString();
                case "week":
                    const week = Math.ceil(d.getDate() / 7);
                    return `Week ${week} - ${d.getMonth() + 1}`;
                case "month":
                    return `${d.getMonth() + 1}/${d.getFullYear()}`;
                case "year":
                    return d.getFullYear().toString();
            }
        }
    });
});
 
 
 
 
 
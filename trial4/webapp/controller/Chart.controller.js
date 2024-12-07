 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "trial4/utils/DataManager",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
    
],
function (Controller, DataManager, JSONModel, MessageBox, Filter, FilterOperator) {
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

        _callToDB: function () {
            const url = DataManager.getOdataUrl(this.getOwnerComponent());
            const oModel = new JSONModel();

            $.ajax({
                url: url,
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
            const chartModel = new JSONModel(this.chartData.slice(this.currentIndex, this.currentIndex + 7));
            this.getView().setModel(chartModel, "chartModel");
        },
        onNavigateForward: function () {
            if (this.currentIndex + 7 < this.chartData.length) {
                this.currentIndex += 7;
                this._updateChart();
            }
        },

        onNavigateBack: function () {
            if (this.currentIndex - 7 >= 0) {
                this.currentIndex -= 7;
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

            Object.keys(dateGroups).forEach(key => {
                sales.push({
                    time: key,
                    sales: dateGroups[key],
                    rawDate: new Date(key.split(" - ")[0]) // Extract the start date for sorting
                });
            });

                // Sort sales data by rawDate (earlier dates first)
            sales.sort((a, b) => a.rawDate - b.rawDate);

            return sales.map(item => ({
                time: item.time, // Keep formatted time
                sales: item.sales
            }));
        },

        _getDateKey: function (date, division) {
            const d = new Date(date);
            switch (division) {
                case "day":
                    return d.toLocaleDateString();
                case "week":
                    const startOfWeek = new Date(d);
                    const dayOfWeek = d.getDay(); // 0 (Sunday) to 6 (Saturday)
                    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to previous Monday
                    startOfWeek.setDate(d.getDate() + offsetToMonday); // Set to Monday
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Sunday
                    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
                case "month":
                    return `${d.getMonth() + 1}/${d.getFullYear()}`;
                case "year":
                    return d.getFullYear().toString();
            }
        },
        onAfterRendering: function () {
            const oVizFrame = this.getView().byId("salesVizFrame");
        
            // Set vizProperties dynamically
            oVizFrame.setVizProperties({
                valueAxis: {
                    scale: {
                        fixedRange: false // Let the chart dynamically scale based on data
                    },
                    title: {
                        visible: true,
                        text: "Number of Sales"
                    }
                },
                categoryAxis: {
                    title: {
                        visible: true,
                        text: "Time Division"
                    }
                },
                legend: {
                    visible: true
                },
                title: {
                    visible: true,
                    text: "Sales Chart"
                }
            });
        }
    });
});
 
 
 
 
 
 
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
                .getRoute("RouteChart") // Replace with the correct route name for this view
                .attachPatternMatched(this._onRouteMatched, this);
            // Initialize Chart.js
            this.getView().addEventDelegate({
                onAfterRendering: () => {
                    const ctx = document.getElementById("productChart").getContext("2d");
                    new Chart(ctx, {
                        type: "bar",
                        data: {
                            labels: ["January", "February", "March"],
                            datasets: [{
                                label: "Sample Data",
                                data: [10, 20, 30],
                                backgroundColor: "rgba(75, 192, 192, 0.6)"
                            }]
                        },
                        options: {
                            responsive: true
                        }
                    });
                }
            });
        },
        _onRouteMatched: function () {
            // Refresh the i18n model when this route is matched
            let oResourceModel = sap.ui.getCore().getModel("i18n");
            if (oResourceModel) {
                this.getView().setModel(oResourceModel, "i18n");
            }
        },
        
        onPress: function()  {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onFrequencyChange: function (oEvent) {
            const selectedKey = oEvent.getSource().getSelectedKey();
            this._updateChartData(selectedKey);
        },

        _initializeChart: function () {
            const ctx = document.getElementById("productChart").getContext("2d");

            this.chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [], // Will be updated dynamically
                    datasets: [] // Will be updated dynamically
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Dynamic Product Chart'
                        }
                    }
                }
            });

            // Set initial data (default to weekly data)
            this._updateChartData("week");
        },

        _updateChartData: function (frequency) {
            // Sample data based on frequency
            const chartData = {
                week: {
                    labels: ["2023-W44", "2023-W45", "2023-W46"],
                    datasets: [
                        { label: "Product A", data: [3, 4, 2], backgroundColor: "rgba(75, 192, 192, 0.6)" },
                        { label: "Product B", data: [2, 5, 3], backgroundColor: "rgba(192, 75, 75, 0.6)" }
                    ]
                },
                month: {
                    labels: ["November 2023", "December 2023", "January 2024"],
                    datasets: [
                        { label: "Product A", data: [10, 15, 5], backgroundColor: "rgba(75, 192, 192, 0.6)" },
                        { label: "Product B", data: [12, 20, 8], backgroundColor: "rgba(192, 75, 75, 0.6)" }
                    ]
                },
                year: {
                    labels: ["2023", "2024"],
                    datasets: [
                        { label: "Product A", data: [150, 80], backgroundColor: "rgba(75, 192, 192, 0.6)" },
                        { label: "Product B", data: [200, 100], backgroundColor: "rgba(192, 75, 75, 0.6)" }
                    ]
                }
            };

            // Update the chart data
            const newData = chartData[frequency];
            this.chart.data.labels = newData.labels;
            this.chart.data.datasets = newData.datasets;
            this.chart.update();
        }
    });
});
 
 
 
 
 
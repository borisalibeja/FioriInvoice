# Fiori Invoice

## Description
This is a simple SAP Fiori application that interacts with an OData service to display and manage data. The app was generated using the SAP Fiori tools suite and is styled using the `sap_horizon` theme for a modern, responsive UI.

## Features
- Responsive Fiori UI built with UI5 (version 1.130.0).
- All CRUD Operations available on the table

## Pre-requisites
- [Node.js LTS](https://nodejs.org) (e.g., v20.x or higher).
- [NPM](https://www.npmjs.com/) (v10.x or higher).
- Active OData service at the specified URL or a local mock setup.

## Getting Started

### Setting up the enviroment on Fiori
1. Open a Dev Space on SAP Business Application Studio
2. Navigate under "projects" folder 

### Install the App Dependecies and Configuration
1. Clone this repository and navigate to the project root:
    1. ```
       git clone --branch main --single-branch https://github.com/borisalibeja/FioriInvoice.git
       ```
    2. Navigate to your FioriTrial project folder

2. Create the App Router and build the MTA Archives:
    
    1. Right click on mta.yaml and then click "Create MTA Module from template":
        
        1. Choose "Approuter Configuration"
        2. Choose "overwrite"
        
    2. Right click again on mta.yaml and then click "Build MTA project"
    3. Open the terminal:
        ```
        cf login
        email: <your btp account email>
        pass: <your btp account pass>
        ```
    4. Right click on mta_archives and then click "Open in integrated terminal":
        ```bash
            cf deploy <name of the mta file>
        ```
3. Go to "Cloud Foundry" on menu bar and bind the services:
    
    1. Under the "Services" folder, find the:
        "trial4-xsuaa-service"
        "trial4-destination-service"
    2. Right click on each of them and choose the ".vscode" folder

4. Start the application on Debug:
    ```bash
    Run trial4
    ```
    - This will open the app in your default browser at `http://localhost:6004`.
5. In Case that page runs into error:
    1. Delete the services manually from the BTP account, 
    2. Delete the .env file under the .vscode folder
    3. Repeat again the proccess 2.4 describet above

### Running with Mock Data
If the OData service is not accessible, you can run the app with mock data:
```bash
npm run start-mock

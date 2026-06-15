# Interactive System Design Architecture Sandbox 🏗️

A drag-and-drop workspace that allows students and developers to visually map out cloud infrastructure and run traffic simulations to learn system design principles.

## 🌟 Features

1. **Drag-and-Drop Toolbox**: Contains pre-configured infrastructure nodes (Clients, Load Balancers, Web Servers, Databases, Caches).
2. **Interactive Canvas**: Drop nodes onto the canvas to architect your system.
3. **Traffic Simulation Engine**: Enter a target Requests Per Second (RPS) and run a simulation. The app calculates total capacity based on the nodes you placed and warns you of any potential bottlenecks.
4. **Cloud Cost Estimator**: Dynamically calculates rough monthly AWS/GCP infrastructure costs based on the deployed components.

## 🚀 Usage

1. Open the simulator from the dashboard.
2. Drag nodes from the left sidebar onto the central canvas. 
3. Try building a standard 3-tier architecture (Client -> Load Balancer -> Web Server -> Database).
4. Use the right sidebar to input an expected traffic load (e.g., 5000 RPS).
5. Click **"Run Simulation"**. The panel will notify you if your current setup can handle the traffic, or if you need to scale up your web servers or add a cache layer!

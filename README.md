# Digital Twin 3D Interactive

Interactive 3D Digital Twin interface using Three.js and WebGL. Features real-time animations, 3D physics simulation, advanced rendering, and camera controls.

## Features

### Interactive 3D Scene
- Real-time 3D visualization with Three.js and WebGL
- Advanced lighting system (ambient, directional, point lights)
- Shadow mapping and fog effects
- Particle system with 500+ particles

### Interactive Objects

#### Pipelines
- **Flow Rate Control**: Adjust flow from 0-100 L/min
- **Valve Control**: Open/close valve to control flow
- **Visual Feedback**: Pipeline glows based on flow rate (green = high, yellow = medium, orange = low)
- **Real-time Metrics**: Flow rate and pressure update in real-time

#### Rotating Machines
- **RPM Control**: Adjust rotation speed from 0-2000 RPM
- **Start/Stop**: Toggle machine operation
- **Temperature**: Temperature automatically adjusts based on RPM
- **Power Calculation**: Power consumption based on RPM

#### Conveyor Belts
- **Speed Control**: Adjust belt speed from 0-2x
- **Start/Stop**: Toggle conveyor operation
- **Visual Feedback**: Becomes semi-transparent when stopped
- **Animated Wheels**: Rotate based on belt speed

#### Sensors
- **Reset Function**: Reset sensor values
- **Real-time Data**: Temperature, humidity, and status monitoring
- **Physics Simulation**: Floating orbs with physics interaction

### Real-time Metrics Dashboard
- **Live Graphs**: Temperature, Pressure, Flow Rate, and Power
- **Metrics Display**: Current values with color-coded indicators
- **Alert System**: Visual warnings for high temperature (>50°C)
- **Auto-update**: Metrics refresh every 200ms

### Control Panel
- **Animation Speed**: Control simulation speed (0-2x)
- **Physics Gravity**: Adjust gravity (-10 to 0)
- **Camera Views**: Multiple preset camera angles (Default, Top, Front, Side, Close)
- **Cooling System**: Control temperature reduction (0-100%)
- **Wireframe Mode**: Toggle wireframe visualization
- **Reset Scene**: Reposition all objects

### Performance Monitoring
- **FPS Counter**: Real-time frame rate
- **Object Count**: Total 3D objects in scene
- **Physics Bodies**: Active physics simulation bodies

### Mini Map
- Top-down view of the scene
- Color-coded object positions
- Real-time updates

### Object Interaction
- **Click Objects**: Select and view details
- **Detailed Information**: Metrics, position, and controls
- **Highlight Effect**: Selected objects glow yellow
- **Interactive Controls**: Sliders and buttons per object type

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Basic Controls

1. **Mouse Drag**: Rotate camera around the scene
2. **Scroll**: Zoom in/out
3. **Right Click + Drag**: Pan camera
4. **Click Objects**: Select and interact with objects

### Adjusting Metrics

1. Click on any object (pipeline, machine, conveyor, sensor)
2. Use the controls in the bottom-left panel
3. Watch real-time metrics update in the bottom-right panel

### Temperature Control

- **Increase**: Set Cooling System to 0%, increase machine RPM
- **Decrease**: Activate Cooling System slider, reduce RPM, or stop machines

### Pipeline Control

1. Click on pipeline or valve
2. Adjust Flow Rate slider (0-100 L/min)
3. Open/Close valve to control flow
4. Watch pressure and flow metrics update

## Technologies

- **Three.js** - 3D graphics library
- **WebGL** - Hardware-accelerated rendering
- **Cannon.js** - Physics engine
- **Vite** - Build tool and dev server

## Project Structure

```
digital-twin-3d/
├── index.html          # Main HTML file
├── style.css           # UI styles
├── main.js             # Main application logic
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

## Key Features Explained

### Physics Simulation
- Uses Cannon.js for realistic physics
- Floating sensors with gravity and damping
- Ground collision detection
- Adjustable gravity system

### Real-time Data
- All metrics are simulated in real-time
- Data updates every 200ms
- Historical data maintained for graphs
- Connected to user interactions

### Advanced Rendering
- PCF Soft Shadows
- ACES Filmic Tone Mapping
- Fog effects
- Particle systems
- Emissive materials


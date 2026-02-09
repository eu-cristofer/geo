# 👤 User Guide - Estado Novo Map

A simple, step-by-step guide for end users of the interactive map.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Using the Map](#using-the-map)
3. [Layer Control](#layer-control)
4. [Finding Information](#finding-information)
5. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### What is This Map?

This interactive map displays historical appeals (apelos) from the Estado Novo period in Rio de Janeiro. Each point on the map represents a location where property owners appealed expropriations during the construction of Avenida Presidente Vargas.

### Accessing the Map

**Online:**
- Visit: https://eu-cristofer.github.io/geo/
- No installation required
- Works on any modern browser
- Mobile-friendly

**Supported Browsers:**
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

---

## Using the Map

### Navigation Basics

#### Zoom In/Out
- **Mouse wheel** - Scroll up/down
- **Plus/Minus buttons** - Top right corner
- **Double-click** - Zoom in on location
- **Pinch gesture** - Mobile devices

#### Pan (Move Around)
- **Click and drag** - Move the map
- **Arrow keys** - Move in directions
- **Touch and drag** - Mobile devices

#### Reset View
- Click the compass icon (top right) to reset north
- Refresh page to return to initial view

### Map Controls

**Navigation Controls (Top Right):**
- ➕ Zoom in button
- ➖ Zoom out button
- 🧭 Compass (reset bearing to north)
- ⛶ Fullscreen toggle

**Scale Bar (Bottom Right):**
- Shows current map scale
- Updates as you zoom

**Layer Control (Top Right):**
- Toggle layers on/off
- Collapsible panel
- See [Layer Control](#layer-control) section

---

## Layer Control

### Opening the Layer Panel

1. Look for the **"Camadas do Mapa"** panel in the top-right corner
2. Click the header to expand/collapse
3. The arrow icon indicates current state

### Available Layers

#### 🔴 Apelos (Appeals)
- **What it shows:** Historical appeal locations
- **Default:** Visible
- **Features:**
  - Red circular markers
  - Clusters at low zoom
  - Click for details

#### 🟠 Bairros Filtrados (Filtered Neighborhoods)
- **What it shows:** Neighborhood boundaries
- **Default:** Hidden
- **Features:**
  - Orange polygon outlines
  - Semi-transparent fill
  - Provides geographic context

### Toggling Layers

1. Open layer control panel
2. Check/uncheck the box next to layer name
3. Layer appears/disappears instantly
4. Color indicator shows layer color

### Best Practices

- **Start with Apelos only** - See the main data clearly
- **Add Bairros** - For geographic context
- **Turn off layers** - When not needed to reduce clutter

---

## Finding Information

### Viewing Appeal Details

#### Method 1: Click Points
1. Zoom in until you see individual red points
2. Click any point
3. Popup appears with:
   - Location name
   - Full description
   - Link to original document (if available)

#### Method 2: Expand Clusters
1. At lower zoom levels, points cluster together
2. Numbers show how many points in cluster
3. Click cluster to zoom in and expand
4. Continue until you see individual points

#### Method 3: Sidebar Information
1. When you click a point, the sidebar updates
2. Left panel shows:
   - Full appeal details
   - Description
   - Link to access document

### Understanding Popups

**Popup Contents:**
- **Title** - Street address or location identifier
- **Description** - Details about the appeal case
- **Link** - "Ver documento →" opens original document in new tab

**Popup Actions:**
- **X button** - Close popup
- **Click outside** - Popup stays open (click X to close)
- **Click another point** - New popup replaces old one

### Accessing Documents

1. Click an appeal point
2. Look for "Ver documento →" link in popup
3. Click link to open Google Drive document
4. Document opens in new browser tab
5. Original historical record displayed

---

## Tips & Tricks

### 🎯 Finding Specific Locations

**By Street Name:**
- Zoom into the area
- Look for clusters near known landmarks
- Expand clusters to find specific addresses

**By Neighborhood:**
1. Turn on "Bairros Filtrados" layer
2. Identify your neighborhood
3. Look for appeal points within boundaries

### 📍 Understanding Clusters

**Cluster Colors:**
- 🟡 **Yellow** - Small cluster (2-9 points)
- 🟠 **Orange** - Medium cluster (10-29 points)
- 🔴 **Red** - Large cluster (30+ points)

**Cluster Numbers:**
- Shows exact count of points
- Click to zoom and expand

### 🗺️ Getting the Best View

**For Overview:**
- Zoom level 12-13
- See distribution across Rio
- Identify concentration areas

**For Details:**
- Zoom level 16-18
- Individual points visible
- Read street addresses

**For Context:**
- Enable "Bairros Filtrados"
- See neighborhood boundaries
- Understand geographic distribution

### 📱 Mobile Usage

**Touch Gestures:**
- **Tap** - Click point/cluster
- **Pinch** - Zoom in/out
- **Drag** - Pan map
- **Two-finger rotate** - Rotate map

**Mobile Tips:**
- Use landscape mode for better view
- Collapse layer control to save space
- Sidebar appears at bottom on mobile

### 🖨️ Printing

**To Print the Map:**
1. Set desired map view and zoom
2. Toggle layers as needed
3. Use browser print (Ctrl+P / Cmd+P)
4. Select landscape orientation
5. Print or save as PDF

**Note:** Sidebar and controls are hidden in print view.

### 💾 Sharing Views

**Share Specific Location:**
1. Navigate to desired view
2. Copy browser URL
3. Share URL with others
4. They see the same starting view

**Screenshot:**
- Use browser screenshot tools
- Or system screenshot (Print Screen / Cmd+Shift+4)
- Includes current map state

---

## Common Questions

### Why don't I see all points?

Points are clustered at lower zoom levels. Zoom in to expand clusters and see individual points.

### Why is the map not loading?

- Check your internet connection
- Refresh the page
- Try a different browser
- Clear browser cache

### Can I download the data?

The GeoJSON data files are available in the project repository on GitHub.

### How accurate are the locations?

Locations are geocoded from historical addresses. Some approximation may be present due to historical record limitations.

### Can I suggest corrections?

Yes! Contact the project authors:
- Francesca: arq.francesca.martinelli@gmail.com
- Cristofer: cristofercosta@yahoo.com.br

### Is this map free to use?

Yes, this is an open-source educational project.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` or `=` | Zoom in |
| `-` or `_` | Zoom out |
| `↑` `↓` `←` `→` | Pan map |
| `Shift + Drag` | Rotate map |
| `Esc` | Close popup |
| `Ctrl/Cmd + P` | Print map |

---

## Accessibility

### Screen Readers

- Map controls have ARIA labels
- Layer control is keyboard navigable
- Semantic HTML structure

### Keyboard Navigation

- Tab through interactive elements
- Enter/Space to activate controls
- Arrow keys to pan map

### High Contrast

- Clear color differentiation
- Strong borders and outlines
- Readable text sizes

---

## Getting Help

### Resources

- **Full Documentation:** See DOCUMENTATION.md
- **Quick Reference:** See QUICK_REFERENCE.md
- **Technical Support:** Open GitHub issue

### Contact

**Project Authors:**
- Francesca Dalmagro Martinelli - arq.francesca.martinelli@gmail.com
- Cristofer Antoni Souza Costa - cristofercosta@yahoo.com.br

**Repository:**
- https://github.com/eu-cristofer/geo

---

## Credits

**Research & Analysis:**
Francesca Dalmagro Martinelli

**Development & Processing:**
Cristofer Antoni Souza Costa

**Data Sources:**
- Historical Archives
- DATA.RIO Municipal Data

**Technology:**
- MapLibre GL JS
- MapTiler
- OpenStreetMap Contributors

---

**Enjoy exploring the historical geography of Rio de Janeiro!** 🗺️



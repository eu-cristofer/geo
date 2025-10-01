# Estado Novo - Mapeamento dos Apelos

Interactive mapping project documenting historical appeals during the Estado Novo period in Rio de Janeiro, related to expropriations for the construction of Avenida Presidente Vargas.

## 📊 Project Overview

This project consists of:
- **Geospatial data processing** (Python/GeoPandas)
- **QGIS mapping** (`.qgz` project file)
- **Professional web application** (Interactive online map)

## 🚀 Quick Start - Web Deployment

### Local Development

```bash
cd web
chmod +x setup.sh
./setup.sh
```

Visit http://localhost:3000

### Deploy to Production

**Easiest: Vercel (1 command)**
```bash
cd web
npm install -g vercel
vercel
```

**See full deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 📁 Project Structure

```
geo/
├── web/                          # Web application
│   ├── src/                      # TypeScript source
│   ├── package.json              # Dependencies
│   ├── vite.config.ts            # Build config
│   ├── Dockerfile                # Container config
│   └── README.md                 # Web-specific docs
├── processed_data/               # Clean GeoJSON data
│   ├── apelos_clean.geojson      # Main dataset
│   └── filtro_bairros.geojson    # Neighborhood boundaries
├── raw_data/                     # Original KML files
├── DATA.RIO/                     # Rio de Janeiro base layers
├── src/geoprocess/               # Python processing tools
├── process.ipynb                 # Data processing notebook
├── apelos.qgz                    # QGIS project
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README.md                     # This file
```

## 🗺️ Web Application Features

- **Interactive clustering** - Points cluster at lower zoom levels
- **Detailed popups** - Click to view appeal information and documents
- **Responsive design** - Works on desktop and mobile
- **Professional UI** - Modern, accessible interface
- **Fast performance** - Optimized builds, CDN delivery
- **SEO optimized** - Meta tags for social sharing

## 💻 Development Setup

### Python Environment (Data Processing)

```bash
# Install package
pip install -e .

# Open Jupyter notebook
jupyter notebook process.ipynb
```

### Web Application

```bash
cd web
npm install
npm run dev
```

## 📦 Deployment Options

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Vercel** | ⭐ Easy | Free | Automatic deployments, global CDN |
| **Netlify** | ⭐ Easy | Free | Open source, forms |
| **GitHub Pages** | ⭐⭐ Medium | Free | Simple hosting |
| **Docker/VPS** | ⭐⭐⭐ Advanced | $5+/mo | Full control |

**Detailed instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔧 Technologies

### Frontend
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **MapLibre GL JS** - Open-source map rendering
- **MapTiler** - Map tiles and styling

### Backend/Processing
- **Python 3.12+**
- **GeoPandas** - Geospatial data processing
- **QGIS** - Desktop GIS application

### Infrastructure
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerization
- **Nginx** - Web server

## 📊 Data Sources

- **Apelos (Appeals)**: Digitized from historical documents
- **Rio de Janeiro Base Layers**: DATA.RIO municipal data
  - Neighborhoods (Bairros)
  - Schools (Escolas)
  - Streets (Logradouros)
  - Blocks (Quadras)

## 🎯 Usage Examples

### View the Web Map
1. Visit deployed site or run locally
2. Zoom and pan to explore Rio de Janeiro
3. Click markers to view appeal details
4. Access original documents via links

### Process New Data
1. Add KML/GeoJSON to `raw_data/`
2. Update `process.ipynb`
3. Export to `processed_data/`
4. Rebuild web application

### Update QGIS Project
1. Open `apelos.qgz` in QGIS
2. Modify layers and styling
3. Export map or use qgis2web plugin

## 🚀 Deployment Workflow

### Recommended Professional Workflow

```bash
# 1. Make changes
git checkout -b feature/my-update

# 2. Test locally
cd web && npm run dev

# 3. Build for production
npm run build
npm run preview

# 4. Commit and push
git add .
git commit -m "Add new features"
git push origin feature/my-update

# 5. Create pull request on GitHub

# 6. Merge to main → Auto-deploys to production
```

## 📈 Performance

- **First Load**: < 100KB (gzipped)
- **Time to Interactive**: < 2s on 3G
- **Lighthouse Score**: 95+ (all metrics)
- **Map Render**: < 500ms

## 🔒 Security

- HTTPS enforced on all platforms
- Environment variables for API keys
- CSP headers configured
- No sensitive data in frontend
- Regular dependency updates

## 👥 Authors

- **Francesca Dalmagro Martinelli** - Research and GIS Analysis
  - Email: arq.francesca.martinelli@gmail.com

- **Cristofer Antoni Souza Costa** - Development and Data Processing
  - Email: cristofercosta@yahoo.com.br

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For questions or issues:
- **GitHub Issues**: [Open an issue](https://github.com/yourusername/geo/issues)
- **Email**: Contact authors above
- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) and [web/README.md](web/README.md)

## 🙏 Acknowledgments

- DATA.RIO for municipal geospatial data
- Historical archives for appeal documents
- OpenStreetMap contributors
- MapTiler for map tiles

## 📚 Additional Resources

- [Full Deployment Guide](DEPLOYMENT.md)
- [Web App Documentation](web/README.md)
- [QGIS Documentation](https://qgis.org/en/docs/)
- [GeoPandas Documentation](https://geopandas.org/)

---

**Quick Commands:**

```bash
# Local Development
cd web && ./setup.sh

# Deploy to Vercel
cd web && vercel --prod

# Deploy with Docker
cd web && docker-compose up -d

# Process data
jupyter notebook process.ipynb
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

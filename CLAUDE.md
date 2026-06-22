# CLAUDE.md — RouteCare Project Context

This file helps Claude Code understand the RouteCare project structure, goals, and development standards. Update this as the project evolves.

## 🎯 Project Identity

- **Name:** RouteCare
- **Mission:** Real-time ambulance dispatch system for rural Uzbekistan
- **Target Users:** Patients, ambulance drivers, dispatch centers
- **Inspiration:** Yandex Taxi, Uber, professional ambulance services

## 🏗️ Project Structure

```
RouteCare/
├── frontend/
│   ├── patient-app/        # Patient interface (call ambulance, track)
│   ├── driver-app/         # Driver interface (accept calls, navigate)
│   └── dispatch-dashboard/ # Admin panel (manage calls, view analytics)
├── app/                    # FastAPI backend (Python)
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── websocket.py
│   ├── crud.py
│   ├── routers/
│   └── services/
├── scripts/
│   └── init_db.py
├── requirements.txt
├── database/
│   └── schema.sql
├── public/                 # Static assets
├── README.md
└── CLAUDE.md               # This file
```

## 🎨 Design Standards

### Visual Identity

- **Style:** Professional, clean, modern (like Yandex Taxi)
- **Color Scheme:**
  - Primary: Medical Red `#E53935`
  - Secondary: Professional Blue `#1976D2`
  - Success: Green `#4CAF50`
  - Background: Light `#F5F5F5`
  - Dark Mode: `#121212`
  - Text: `#333333` (light), `#FFFFFF` (dark)
  - Borders: `#EEEEEE` (light), `#424242` (dark)

### Typography

- **Fonts:** System fonts (Arial, Helvetica, sans-serif)
- **Headlines:** 20–24px, Bold (500–700 weight)
- **Body:** 14–16px, Regular (400 weight)
- **Small text:** 12–13px, Regular (400 weight)
- **Buttons:** 14–16px, Medium (500 weight)

### Spacing & Layout

- **Padding:** 8px, 16px, 24px (use multiples of 8)
- **Margin:** 16px, 24px, 32px
- **Border radius:** 8px (cards/inputs), 24px (buttons), 50% (avatars)
- **Gap between elements:** 16px
- **Card padding:** 24px
- **Button height:** 48px
- **Input height:** 44px

### Animations

- **Transitions:** 200–300ms for smooth motion
- **Easing:** ease-in-out for most animations
- No jarring or slow animations
- Mobile: Disable animations if `prefers-reduced-motion`

## 🔧 Technical Stack

### Frontend

- **Languages:** HTML5, CSS3, JavaScript (ES6+)
- **Framework:** Vanilla JavaScript (no dependencies initially)
- **Maps:** Leaflet.js + OpenStreetMap (CartoDB Dark Matter tiles, no API key)
- **Real-time:** Native WebSockets for live location updates
- **Authentication:** JWT tokens in localStorage
- **HTTP:** Fetch API for REST calls
- **Responsive:** Mobile-first design, works on all screen sizes

### Backend

- **Runtime:** Python 3.11+
- **Framework:** FastAPI (Uvicorn ASGI server)
- **Database:** PostgreSQL 14+ via SQLAlchemy
- **Real-time:** Native WebSockets (FastAPI WebSocket endpoint)
- **Authentication:** JWT (PyJWT)
- **Hashing:** bcrypt for OTP codes
- **Environment:** python-dotenv for config
- **Rate limiting:** slowapi

### Infrastructure

- **Version Control:** Git + GitHub
- **Frontend Deployment:** Vercel
- **Backend Deployment:** Railway or Render
- **Database:** PostgreSQL Cloud (ElephantSQL or similar)

## 👥 User Roles & Features

### Patient / Caller

- Call ambulance with one tap
- Enter location (address or map)
- Real-time ambulance tracking
- See driver details and ETA
- Call/chat with driver
- Save emergency contacts
- View call history

### Ambulance Driver

- Accept/reject dispatched calls
- See patient location and details
- Real-time turn-by-turn navigation
- Share location with dispatch center
- Toggle status (Available / On Call / Off Duty)
- View earnings summary
- Call patient for clarification

### Dispatch Center

- View all ambulances on map
- Assign calls to nearest ambulance
- Monitor response times
- See analytics and coverage
- Manage emergency contacts
- System status monitoring

## 📐 Component Standards

### Always Include

1. **Loading states** — Show spinners/skeletons during async operations
2. **Error handling** — Display user-friendly error messages
3. **Accessibility** — Proper ARIA labels, keyboard navigation
4. **Mobile responsive** — Works perfectly on 320px to 1920px
5. **Real-time updates** — WebSocket for live data
6. **Animations** — Smooth transitions, not jarring
7. **Feedback** — Visual/toast notifications for user actions

### Never Include

- Hardcoded API URLs (use `.env`)
- `console.log` statements in production code
- Unhandled promise rejections
- Large unoptimized images
- Inline styles (use CSS classes)
- Deprecated browser APIs

## 🔐 Security Standards

### Authentication

- Phone-based OTP (SMS verification)
- JWT tokens stored in localStorage
- Tokens expire after 24 hours
- Refresh tokens for re-authentication
- No passwords stored in plaintext

### Data Protection

- All location data encrypted in transit (HTTPS)
- Patient information is private (health-data confidentiality)
- API requires authentication for all endpoints
- Rate limiting (max 10 requests/minute per IP)
- SQL injection prevention (use parameterized queries)

### API Security

- Validate all user inputs on backend
- Sanitize database queries
- Use CORS only for trusted origins
- Never expose sensitive data in API responses
- Log all security-related events

## 📱 Responsive Design Breakpoints

- **Mobile:** 320px – 480px
- **Tablet:** 481px – 768px
- **Desktop:** 769px – 1024px
- **Wide Desktop:** 1025px+

All layouts must be fully functional at all breakpoints.

## 🎯 Development Workflow

### When Building Features

1. Create files in appropriate folders (patient-app, driver-app, etc.)
2. Use semantic HTML
3. Style with CSS classes (never inline styles)
4. Add error boundaries and loading states
5. Test on mobile and desktop
6. Update CLAUDE.md if structure changes

### Code Style

- Use `camelCase` for variables/functions
- Use `SCREAMING_SNAKE_CASE` for constants
- Use `kebab-case` for CSS classes
- Add comments for complex logic
- Keep functions under 100 lines
- Use meaningful variable names

### File Naming

- **Components:** PascalCase (`PatientApp.html`)
- **Utilities:** camelCase (`mapUtils.js`)
- **Stylesheets:** kebab-case (`patient-app.css`)
- **Images:** kebab-case (`ambulance-icon.svg`)

## 🚀 Before Each Build Session

Claude should:

1. Read this CLAUDE.md to understand the project
2. Check the folder structure
3. Maintain consistent design across all files
4. Use the color scheme and typography standards
5. Ensure mobile responsiveness
6. Add proper error handling
7. Include loading states
8. Test on multiple screen sizes

## 📊 Key Metrics to Track

- **Response time:** Target < 2 minutes
- **Location update latency:** < 500ms
- **App load time:** < 2 seconds
- **Ambulance availability:** 90%+ coverage
- **User satisfaction:** 4.5+ stars
- **System uptime:** 99.9%

## 🔄 Continuous Improvement

As features are built:

- Get user feedback from drivers and patients
- Test on slow networks (3G)
- Optimize performance
- Fix bugs immediately
- Update documentation
- Monitor analytics

## 📝 Important Notes

- **Ambulance Simulation:** For testing, use realistic ambulance movement simulation (not instant jumps)
- **Real-time Updates:** The backend emits WebSocket location updates every 2–3 seconds
- **Map Updates:** Leaflet shows real-time markers; update positions smoothly
- **Dark Mode:** Implement toggle, save preference in localStorage
- **Offline Support:** Plan for poor connectivity in rural areas
- **Phone Numbers:** Use E.164 format (`+998XXXXXXXXX` for Uzbekistan)

## 🎓 Claude's Role

When building RouteCare:

1. **Understand context** — Remember this is for rural Uzbekistan ambulances
2. **Maintain design consistency** — Follow the color scheme and typography
3. **Prioritize mobile** — Mobile-first approach
4. **Add real-time features** — Use WebSockets for live location
5. **Handle errors gracefully** — Show user-friendly messages
6. **Test responsiveness** — Works on all screen sizes
7. **Optimize performance** — Fast load times, smooth animations
8. **Document changes** — Update file structure as needed

## 📞 Key Contacts & Resources

- **Project Lead:** Alisher
- **Leaflet Docs:** https://leafletjs.com/reference.html
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Last Updated:** June 2, 2026
**Project Phase:** MVP — Core ambulance dispatch system
**Next Phase:** Mobile app (React Native), payment integration, analytics
```

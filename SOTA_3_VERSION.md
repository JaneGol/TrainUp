# SOTA 3 - Version Information

This version "SOTA 3" represents a comprehensive update to the TrainUpSOTA Sports Performance Management Platform with critical bug fixes and enhanced functionality:

## New Features and Enhancements

1. **Critical Database Fix**
   - Fixed Morning Self-Control Diary form submission error
   - Updated sleep hours field to accept decimal values (e.g., 7.5 hours)
   - Changed database column type from integer to real for precise sleep tracking
   - Resolved validation errors preventing diary submissions

2. **Enhanced Coach Dashboard Interface**
   - Streamlined key metrics with better visual hierarchy
   - Enhanced "Awaiting data" state display with subtle, smaller text (10px)
   - Properly calculated Sick/Injured metric to correctly identify athletes with symptoms
   - Daily reset logic for key metrics data
   - Improved readability with black text on lime green backgrounds

3. **Advanced Load Insights Section**
   - Athlete-specific data filtering when individual player is selected
   - Improved spacing between "Athlete" and "Time Period" selectors
   - Optimized data visualization and filtering logic
   - Maintains existing visual design while enhancing functionality

4. **Refined Self-Control Diary for Athletes**
   - Simplified muscle soreness reporting with single 0-5 intensity slider
   - Comprehensive injury reporting section with:
     - Yes/No toggle for injury reporting
     - 1-10 pain intensity scale
     - Pain status tracking (getting better, worse, or unchanged)
     - Optional notes field for detailed information
   - Fixed decimal sleep hours input validation

5. **Application Rebranding**
   - Complete rebrand from "SportSync" to "TrainUpSOTA"
   - Updated all UI components and references
   - Consistent branding across athlete and coach interfaces

6. **System Stability Improvements**
   - Optimized daily wellness score calculation
   - Enhanced UI consistency across all interfaces
   - Improved mobile experience for athletes
   - Fixed form validation and database schema alignment

This version maintains the dark-themed UI with lime green accent colors (#CBFF00) while providing a fully functional, bug-free experience for both coaches and athletes.

**Technical Stack:**
- React (TypeScript) frontend with Tailwind CSS
- Node.js/Express backend with PostgreSQL database
- Drizzle ORM for database management
- Role-based authentication system
- Mobile-first responsive design

Version: SOTA 3
Date: May 23, 2025
Status: Stable Release
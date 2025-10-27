Below is a Product Requirements Document (PRD) outlining how to position experiences and concierge services as a PRIMARY conversion driver for Casa O bookings. This dual-approach strategy includes both a public-facing experiences showcase page AND an in-booking enhancement page with selection capabilities and discount incentives.

---

## 1. Overview

**Goal:** Position Casa O as a complete vacation package provider by showcasing curated experiences BEFORE and DURING the booking process, driving higher conversion rates and perceived value.

**Strategic Shift:** Experiences are not add-ons—they are core to the value proposition. Guests should discover amazing adventures and services early in their journey, building excitement and mental commitment before they even select dates.

**Problem Statement:** Traditional vacation rentals compete solely on lodging features and price. By prominently featuring curated experiences (tours, wellness, concierge services), Casa O differentiates itself and creates a "complete vacation package" perception that increases booking intent and average transaction value.

**Target Audience:** Guests booking vacation rentals through Bluezone Experience who are interested in customizing their stay with tours and concierge services.

## 2. Scope

This PRD covers TWO interconnected pages:

### **A. Public Experiences Page (/experiences)**
* Showcase all 16 tours and 13 concierge services with beautiful imagery
* Categorize by type: Adventures, Water Activities, Nature, Wellness, Concierge
* Provide detailed descriptions, durations, and highlights
* Include "Book Your Stay" CTAs that open the booking calendar
* Serve as a primary conversion and discovery tool
* Accessible via main navigation and homepage teasers

### **B. In-Booking Enhancement Page (/enhance)**
* Display same experiences in compact, selectable format
* Provide checkboxes to capture specific guest selections
* Apply 5% discount to lodging when 2+ experiences selected
* Show real-time discount notification as selections change
* Integrate seamlessly into booking flow (after date selection, before checkout)
* Pass selections to handoff/checkout for PM follow-up

### Out of scope:
* Payment processing for experiences (interest capture only)
* Real-time pricing for experiences (to be added when available)
* Complex bundling beyond "2+ items = 5% off lodging"
* Inventory management for experiences (PM handles manually)

## 3. Requirements

### 3.1 Functional Requirements

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR1** | **Display all tours**: The page must list each tour option from the Flipsnack book and the website’s “Select a Tour” dropdown. Each listing includes a short description, typical duration, and key inclusions.                                                                                                                                         |
| **FR2** | **Display all concierge services**: The page must list each concierge service (airport transfers, transportation rentals, babysitting, restaurant reservations, grocery delivery, flower arrangements, photo sessions, cooking classes, chef services, bartender services, yoga, massages, beach rentals). Each listing includes a concise description. |
| **FR3** | **Checkboxes for selection**: Each tour/service must have a checkbox to allow the guest to indicate interest.                                                                                                                                                                                                                                           |
| **FR4** | **Discount trigger**: When a guest selects two or more items (any combination of tours or services), the system displays a message indicating they will receive an additional 5 % discount on their lodging reservation. The discount should be applied automatically in the reservation summary.                                                       |
| **FR5** | **Persist selections**: The guest’s selected items must be passed to the reservation system upon submitting the booking request so that the concierge team can follow up with pricing and availability.                                                                                                                                                 |
| **FR6** | **Call‑to‑Action**: Each section of the page should include a strong CTA button (e.g., “Continue to Booking” or “Add These Experiences”) encouraging guests to finalize their reservation. The CTA should reiterate the discount incentive when applicable.                                                                                             |
| **FR7** | **Mobile‑friendly design**: The page must be responsive and easy to navigate on mobile devices, using large tap targets for checkboxes and buttons.                                                                                                                                                                                                     |
| **FR8** | **Accessibility**: Checkboxes and CTAs must be keyboard‑accessible and include proper ARIA labels. Text should have sufficient contrast for readability.                                                                                                                                                                                                |

### 3.2 Non‑Functional Requirements

* **Performance:** The page should load within 2 seconds on a standard broadband connection.
* **Security:** User input (selected items) must be transmitted over HTTPS. No sensitive information (payment details) is collected on this page.
* **Scalability:** The system should support adding new tours/services without major redesigns (e.g., by managing content through a CMS).
* **Localization:** Text strings should be stored in a way that supports future translation.

## 4. User Flow

1. **Guest selects property** and begins booking.
2. After entering dates and guest info, **the “Enhance Your Stay” page loads** (long‑scroll format).
3. **Tours Section** appears first:

   * Brief introductory paragraph explaining that the expert tour team curates unforgettable experiences.
   * List of tours (see section 5) with summary, typical duration, inclusions and a checkbox.
4. **Concierge Services Section** follows:

   * Brief paragraph inviting guests to add concierge services to their stay.
   * List of services (see section 6) with summary and a checkbox.
5. **Discount Notification**:

   * Real‑time message or badge updates when the user selects two or more checkboxes: “You’ve selected 2 experiences — you’ll receive an extra 5 % off your lodging!”
6. **CTA**: A sticky footer button (e.g., “Continue to Checkout”) follows guests as they scroll. When pressed, it moves them to the reservation summary, where the discount is applied and selected items are noted.
7. **Reservation Summary**: The summary page displays selected items and notes that a concierge member will confirm availability and pricing.

## 5. Tours to Include (with example summaries)

Below is an example of how each tour might be summarized. Actual descriptions can be refined with marketing copy.

* **ATV Tour** – Off‑road adventure through forests and beaches; includes ATV rental, guide and water; ~2 hrs.
* **Canopy Tour** – High‑flying zip‑line course with hanging bridges; includes equipment, snacks and water.
* **ATV + Canopy Combo** – Best of both worlds: a half‑day combining ATV adventure and canopy zip‑lines.
* **Horseback Riding** – Gentle ride matched to your skill level along beaches and mountains; includes guide and water.
* **Turtle Tours** – Evening tour to witness nesting turtles on the Pacific coast (seasonal).
* **Animal Sanctuary + Zip Line** – Visit a wildlife sanctuary followed by a thrilling zip‑line run.
* **Rincón de la Vieja Waterfall & Hike** – Explore volcanic terrain and swim in Oropéndola Waterfall; includes lunch; full‑day.
* **Rio Celeste Waterfall Hike** – Hike to the famous turquoise waterfall; includes lunch; full‑day.
* **All‑Day Adventure (Rincón de la Vieja)** – Multi‑activity day: hanging bridges, canopy, horseback, hot springs and mud bath.
* **Monteverde Cloud Forest All‑day Adventure** – Experience the cloud forest’s biodiversity and hanging bridges; full‑day.
* **Arenal Volcano & Rainforest All‑day Adventure** – Visit Arenal volcano and choose activities like La Fortuna waterfall, hanging bridges, rainforest hikes and hot springs.
* **Deep Sea Fishing (Half/Full Day)** – Charter a 27 ft or 29 ft boat to fish for marlin, tuna, mahi‑mahi and more.
* **Scuba Diving** – Dive at Catalina Islands with professional guides (all levels).
* **Estuary Tours** – Quiet boat ride through mangroves spotting birds and crocodiles.
* **Palo Verde National Park Boat Tour** – River safari to see crocodiles, birds and monkeys; includes lunch.
* **White Water Rafting (Tenorio River Class III/IV)** – Raft Class III/IV rapids for 2.5 hrs.
* **Surf Lessons (2 Hours)** – Learn to surf with a bilingual instructor; board and water included.

These names align with the drop‑down options from the “Reserve Tour” form.

## 6. Additional Concierge Services

Each of these should have a checkbox and a brief description on the page:

* **Expert local tour team** – Optionally highlight that guests can request custom tour planning beyond the listed experiences.
* **Hassle‑free airport transfers** – Liberia and Tamarindo airport transfers arranged by the concierge.
* **Vehicle rentals** – Cars, golf carts, scooters and motorcycles for local transportation.
* **Professional babysitting** – Babysitters for children 1 month and older (48‑hour notice).
* **Restaurant reservations** – Hand‑picked romantic dinners and special celebration bookings.
* **Grocery delivery** – Groceries delivered to your door before arrival or during your stay.
* **Flower arrangements & decoration** – Custom floral designs for anniversaries, birthdays or surprise setups.
* **Photo sessions** – Professional photography to capture family vacation memories.
* **Cooking classes** – Private cooking lessons with a local chef (2‑hour sessions).
* **Gourmet chef services** – Private in‑villa chef preparing multi‑course meals.
* **Personal bartender services** – Bartender for private events or cocktail hours.
* **Yoga classes** – Personalized yoga sessions in your villa or by the beach.
* **Massages** – Luxurious massages either in‑room or on your terrace.
* **Beach equipment rentals** – Beach chairs, umbrellas and coolers delivered to your favorite spot.

## 7. UI/UX Considerations

* **Long‑scroll layout:** Break the page into clearly defined sections with headings (“Adventures,” “Concierge Services,” “Why Choose Us?”).
* **Visual cues:** Use icons or thumbnails for each item to create visual interest. For example, a surfboard icon next to Surf Lessons.
* **Checkbox styling:** Use large, easily tappable checkboxes. When checked, highlight the card to show selection.
* **Discount banner:** A small banner or badge that updates when two or more items are selected (“5 % discount applied!”).
* **Sticky CTA:** Keep a “Continue to Checkout” button visible at the bottom of the screen to encourage next steps.
* **Persuasive copy:** Throughout the page, remind guests of the benefits (expert guides, convenience, exclusive discounts) and encourage them to add experiences to make their stay unforgettable.

## 8. Success Metrics

* **Attachment rate:** Percentage of reservations that include at least one tour or concierge service.
* **Average number of selections:** Track how many experiences/services guests select.
* **Conversion rate:** Percentage of visitors to the page who proceed to complete their booking.
* **Incremental revenue:** Additional revenue generated from tours and services.
* **User feedback:** Collect ratings on the booking experience to refine the page.

---

This PRD provides a clear foundation for designing and implementing an “Enhance Your Stay” selection page that both summarizes the tours from the Flipsnack book and the extra concierge services, incentivizes guests through discounts, and integrates smoothly into the booking flow.

# 📱👶📈 Babysteps

**Babysteps** is a mobile application designed to help parents track and manage their infant’s daily activities, development, and health. Powered by React Native and Express, it uses both MySQL and Firebase Firestore for flexible, scalable data handling.

## Features

- **Activity Tracking**
  - Diaper changes
  - Sleep sessions
  - Feeding schedules
  - Growth metrics
  - Medical records

- **Charts & Insights**
  - Visualize trends for the current month or the entire year
  - Interactive and user-friendly data charts

- **Music Player**
  - Built-in player with soothing `.mp3` tracks for infants
  - Tracks are stored and streamed from Firebase Firestore

- **User & Child Management**
  - Single parent account can manage multiple children
  - Each child has a separate profile with independent activity tracking

- **Hybrid Storage**
  - MySQL for structured data: user accounts, children, activity records
  - Firebase Firestore for media file storage (e.g., `.mp3` files)

- **Cross-Platform**
  - Fully compatible with both iOS and Android via React Native

## Tech Stack

- **Frontend**: React Native  
- **Backend**: Express.js  
- **Databases**:  
  - MySQL (relational data: users, children, logs)  
  - Firebase Firestore (NoSQL: music file storage)  

## How It Works

1. A single parent (user) registers an account via the app.
2. The parent can add and manage multiple children under the same account.
3. Each child is associated with the parent through a MySQL one-to-many relationship.
4. Every child has their own set of records and activity logs:
   - Diaper changes
   - Sleep tracking
   - Feeding history
   - Growth metrics
   - Medical records
5. Activity data is saved in MySQL and queried based on the selected child.
6. The built-in music player accesses `.mp3` tracks stored in Firebase Firestore and plays them for the selected child.
7. Visual charts present monthly or yearly activity summaries for each child individually.

## Future Enhancements

- AI-generated suggestions based on activity patterns  
- Doctor appointment and vaccination reminders  
- Integrated photo gallery with cloud storage  
- Support for exporting data reports (PDF/CSV) for pediatric visits  
- Enhanced multi-child dashboard view  

---

📱 **Babysteps** — making parenting smarter, simpler, and more organized.

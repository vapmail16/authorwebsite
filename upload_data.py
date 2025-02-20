import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import os
from datetime import datetime
import csv

def parse_date(date_str):
    """Try multiple date formats"""
    date_formats = [
        '%Y-%m-%d',  # 2024-03-20
        '%d/%m/%Y',  # 20/02/2025
        '%m/%d/%Y',  # 02/20/2025
        '%d-%m-%Y',  # 20-02-2025
        '%Y/%m/%d'   # 2024/03/20
    ]
    
    for date_format in date_formats:
        try:
            return datetime.strptime(date_str, date_format)
        except ValueError:
            continue
    
    raise ValueError(f"Date '{date_str}' doesn't match any known format. Please use YYYY-MM-DD format.")

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def clean_text(text):
    """Clean text by removing invalid characters and normalizing spaces"""
    if not text:
        return ""
    # Replace common problematic characters
    text = text.replace('', '')
    # Remove other non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char.isspace())
    # Normalize spaces
    return ' '.join(text.split())

def upload_media_links(db, csv_file):
    """Upload media links from CSV"""
    try:
        df = pd.read_csv(csv_file)
        collection = db.collection('media_links')
        
        for _, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row['title']) or pd.isna(row['url']):
                    continue
                    
                parsed_date = parse_date(row['date'])
                
                # Convert category to lowercase and remove spaces to match website structure
                category = row['category'].lower().strip()
                if category == 'news':
                    category = 'news'
                elif category == 'blogs':
                    category = 'blogs'
                elif category == 'social media':
                    category = 'social'
                elif category == 'hindi news':
                    category = 'hindiNews'
                elif category == 'print media':
                    category = 'printMedia'
                elif category == 'classifieds':
                    category = 'classifieds'
                elif category == 'more classifieds':
                    category = 'otherClassifieds'
                elif category == 'other platforms':
                    category = 'otherPlatforms'

                doc = {
                    'title': row['title'].strip(),
                    'url': row['url'].strip(),
                    'category': category,
                    'platform': row.get('platform', '').strip(),  # Add platform field
                    'date': parsed_date.strftime('%Y-%m-%d'),  # Store as string to match existing format
                    'description': row['description'].strip() if not pd.isna(row['description']) else '',
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'active': True  # Add active status
                }
                collection.add(doc)
                print(f"Added media link: {row['title']} in category: {category}")
            except Exception as e:
                print(f"Error processing row {_}: {e}")
                continue
    except Exception as e:
        print(f"Error uploading media links: {e}")

def upload_writings(db):
    """Upload writings from CSV to Firebase"""
    try:
        # Read CSV file with explicit encoding
        with open('csv/writings.csv', 'r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            writings_ref = db.collection('writings')
            count = 0
            
            for row in reader:
                # Clean and prepare data
                doc = {
                    'title': clean_text(row['title']),
                    'url': clean_text(row['url']),
                    'category': clean_text(row['category']).lower(),
                    'publication': clean_text(row['publication']),
                    'date': parse_date(row['date']),
                    'description': clean_text(row['description']),
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                }
                
                # Add to Firebase
                writings_ref.add(doc)
                count += 1
                print(f"Added writing: {doc['title']}")
            
            print(f"Successfully uploaded {count} writings")
            
    except Exception as e:
        print(f"Error uploading writings: {e}")

def upload_apps(db, csv_file):
    """Upload apps from CSV"""
    try:
        df = pd.read_csv(csv_file)
        collection = db.collection('apps')
        
        for _, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row['title']) or str(row['title']).strip() == '':
                    continue
                    
                # Handle empty tech_stack
                tech_stack = []
                if not pd.isna(row['tech_stack']):
                    tech_stack = [tech.strip() for tech in str(row['tech_stack']).split(',') if tech.strip()]
                
                doc = {
                    'title': row['title'],
                    'description': row['description'] if not pd.isna(row['description']) else '',
                    'category': row['category'] if not pd.isna(row['category']) else '',
                    'imageUrl': row['image_url'] if not pd.isna(row['image_url']) else '',
                    'liveUrl': row['live_url'] if not pd.isna(row['live_url']) else '',
                    'githubUrl': row['github_url'] if not pd.isna(row['github_url']) else '',
                    'techStack': tech_stack,
                    'status': row['status'] if not pd.isna(row['status']) else '',
                    'createdAt': firestore.SERVER_TIMESTAMP
                }
                collection.add(doc)
                print(f"Added app: {row['title']}")
            except Exception as e:
                print(f"Error processing row {_}: {e}")
                continue
    except Exception as e:
        print(f"Error uploading apps: {e}")

def main():
    """Main function to handle content upload"""
    db = initialize_firebase()
    if not db:
        print("Failed to initialize Firebase")
        return

    while True:
        print("\nContent Upload Menu:")
        print("1. Upload Media Links")
        print("2. Upload Writings")
        print("3. Upload Apps")
        print("4. Exit")

        choice = input("\nEnter your choice (1-4): ")

        if choice == '1':
            upload_media_links(db, "csv/media_links.csv")
        elif choice == '2':
            upload_writings(db)
        elif choice == '3':
            upload_apps(db, "csv/apps.csv")
        elif choice == '4':
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main() 
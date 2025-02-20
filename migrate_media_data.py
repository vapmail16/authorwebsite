import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
import re

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def convert_js_to_json(js_str):
    """Convert JavaScript object to valid JSON"""
    # First, save all quoted strings
    quoted_strings = {}
    pattern = r'"[^"]*"'
    
    def save_string(match):
        placeholder = f"__PLACEHOLDER_{len(quoted_strings)}__"
        quoted_strings[placeholder] = match.group(0)
        return placeholder
    
    # Save quoted strings
    js_str = re.sub(pattern, save_string, js_str)
    
    # Quote unquoted property names
    js_str = re.sub(r'(\s*)(\w+)(:)', r'\1"\2"\3', js_str)
    
    # Handle trailing commas in arrays and objects
    js_str = re.sub(r',(\s*[}\]])', r'\1', js_str)
    
    # Handle missing values
    js_str = re.sub(r':\s*,', ': "",', js_str)
    
    # Restore quoted strings
    for placeholder, original in quoted_strings.items():
        js_str = js_str.replace(placeholder, original)
    
    return js_str

def read_media_data():
    """Read data from mediaData.js"""
    try:
        with open('mediaData.js', 'r', encoding='utf-8') as file:
            content = file.read()
            
            # Extract the content between the curly braces
            match = re.search(r'const\s+mediaData\s*=\s*({[\s\S]*});', content)
            if not match:
                raise ValueError("Could not find mediaData object in file")
            
            js_obj = match.group(1)
            
            # Convert to valid JSON
            json_str = convert_js_to_json(js_obj)
            
            # Debug output
            print("\nConverted JSON sample:")
            lines = json_str.split('\n')[:10]  # First 10 lines
            for line in lines:
                print(line)
            
            return json.loads(json_str)
            
    except Exception as e:
        print(f"\nError reading mediaData.js: {e}")
        print("Original content sample:")
        lines = content.split('\n')[:10]  # First 10 lines
        for line in lines:
            print(line)
        return None

def migrate_data(db, media_data):
    """Migrate data to Firebase"""
    try:
        # Create a new collection for categorized media links
        media_collection = db.collection('categorized_media')
        
        # Add each category as a document with its links as an array
        for category, links in media_data.items():
            print(f"\nMigrating category: {category}")
            # Filter out incomplete entries
            valid_links = [link for link in links if 'title' in link and 'url' in link]
            
            # Convert all values to strings and ensure required fields
            cleaned_links = []
            for link in valid_links:
                cleaned_link = {
                    'title': str(link.get('title', '')),
                    'url': str(link.get('url', '')),
                    'platform': str(link.get('platform', '')),
                    'description': str(link.get('description', '')),
                    'date': str(link.get('date', ''))
                }
                cleaned_links.append(cleaned_link)
            
            doc_ref = media_collection.document(category)
            doc_ref.set({
                'links': cleaned_links,
                'count': len(cleaned_links),
                'lastUpdated': firestore.SERVER_TIMESTAMP
            })
            print(f"✓ Successfully migrated {len(cleaned_links)} links for {category}")
            
    except Exception as e:
        print(f"Error migrating data: {e}")

def main():
    print("Starting migration process...")
    
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        print("Failed to initialize Firebase")
        return
    
    # Read media data
    print("\nReading media data...")
    media_data = read_media_data()
    if not media_data:
        print("Failed to read media data")
        return
    
    # Migrate data
    print("\nMigrating data to Firebase...")
    migrate_data(db, media_data)
    print("\nMigration completed successfully!")

if __name__ == "__main__":
    main() 
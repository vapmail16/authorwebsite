import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

def update_apps_schema():
    """Add website_url field to existing app documents"""
    try:
        db = initialize_firebase()
        if not db:
            return

        # Get all apps
        apps_ref = db.collection('apps')
        apps = apps_ref.get()

        print(f"Found {len(apps)} apps to update")

        # Update each app document
        for app in apps:
            data = app.to_dict()
            
            # Only update if website_url doesn't exist
            if 'website_url' not in data:
                print(f"Adding website_url field to app: {data.get('title', 'Untitled')}")
                apps_ref.document(app.id).update({
                    'website_url': None  # or '' if you prefer empty string
                })

        print("Schema update completed successfully!")

    except Exception as e:
        print(f"Error updating schema: {e}")

if __name__ == "__main__":
    update_apps_schema() 
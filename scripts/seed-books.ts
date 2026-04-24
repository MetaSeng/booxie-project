import { config as loadEnv } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

loadEnv({ path: '.env.local' });

const demoEmail = process.env.VITE_DEMO_EMAIL || process.env.DEMO_EMAIL;
const demoPassword = process.env.VITE_DEMO_PASSWORD || process.env.DEMO_PASSWORD;
const demoName = process.env.VITE_DEMO_NAME || process.env.DEMO_NAME || 'Alex (Demo)';

if (!demoEmail || !demoPassword) {
  console.error('Missing demo credentials. Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env.local.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const sampleBooks = [
  {
    id: 'seed-international-advance-mathematics',
    title: 'International Advance Mathematics',
    author: 'Author 1',
    price: 1.125,
    condition: 'good',
    type: 'sale',
    status: 'available',
    category: 'Textbook',
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'Sample textbook listing for demo and local testing.',
  },
  {
    id: 'seed-book-set-12',
    title: 'Book set 12',
    author: 'Author 2',
    price: 6.25,
    condition: 'good',
    type: 'sale',
    status: 'available',
    category: 'Textbook',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'Sample bundle listing for demo and local testing.',
  },
  {
    id: 'seed-khmer-literature',
    title: 'Khmer Literature',
    author: 'Author 3',
    price: 1,
    condition: 'Intermediate',
    type: 'sale',
    status: 'available',
    category: 'Novels',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'Sample literature listing for demo and local testing.',
  },
  {
    id: 'seed-toefl-practice',
    title: 'TOEFL Practice',
    author: 'Author 4',
    price: 2,
    condition: 'Intermediate',
    type: 'sale',
    status: 'available',
    category: 'English',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300&h=400',
    description: 'Sample English practice listing for demo and local testing.',
  },
];

async function main() {
  const result = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
  const sellerId = result.user.uid;

  for (const book of sampleBooks) {
    await setDoc(doc(db, 'books', book.id), {
      ...book,
      sellerId,
      sellerName: demoName,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  console.log(`Seeded ${sampleBooks.length} books into books collection for ${demoEmail}.`);
}

main().catch((error) => {
  console.error('Failed to seed books.');
  console.error(error);
  process.exit(1);
});

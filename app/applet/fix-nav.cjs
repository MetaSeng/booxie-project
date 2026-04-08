const fs = require('fs');
const replacements = {
  'src/screens/ChatListScreen.tsx': '/',
  'src/screens/BookDetailsSellScreen.tsx': '/sell',
  'src/screens/BookDetailScreen.tsx': '/',
  'src/screens/GeminiChatScreen.tsx': '/',
  'src/screens/CartScreen.tsx': '/',
  'src/screens/OrderConfirmationScreen.tsx': '/',
  'src/screens/ChatScreen.tsx': '/chat',
  'src/screens/RewardsScreen.tsx': '/profile',
  'src/screens/LoginScreen.tsx': '/welcome',
  'src/screens/SearchScreen.tsx': '/',
  'src/screens/CheckoutScreen.tsx': '/cart',
  'src/screens/SignupScreen.tsx': '/welcome',
  'src/screens/ScanEditScreen.tsx': '/sell',
  'src/screens/PlaceholderScreen.tsx': '/'
};
for (const [file, route] of Object.entries(replacements)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/navigate\(-1\)/g, `navigate('${route}')`);
  content = content.replace(/className="p-2 -ml-2/g, 'className="relative z-50 p-2 -ml-2');
  fs.writeFileSync(file, content);
}
console.log('Done replacing navigate(-1)');

import 'dart:async';

import 'package:firebase_core/firebase_core.dart'; // ✅ Firebase Core
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// ✅ Import the generated Firebase options file (created by `flutterfire configure`)
import 'firebase_options.dart';
// 🧩 Import your providers
import 'providers/auth_provider.dart';

import 'routes.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 🟢 Start the app immediately
  runApp(const DriverApp());

  // ⚙️ Initialize Firebase asynchronously (non-blocking)
  unawaited(_initFirebase());
}

Future<void> _initFirebase() async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    debugPrint("🔥 Firebase initialized successfully!");
  } catch (e) {
    debugPrint("❌ Firebase initialization failed: $e");
  }
}

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) {
            final provider = AuthProvider();
            provider
                .initAuth(); // ✅ Async initialization to avoid blocking startup
            return provider;
          },
        ),
      ],
      child: MaterialApp(
        title: 'Sai Cabz Driver',
        theme: buildTheme(),
        debugShowCheckedModeBanner: false,
        initialRoute: AppRoutes.splash,
        routes: AppRoutes.map,
      ),
    );
  }
}

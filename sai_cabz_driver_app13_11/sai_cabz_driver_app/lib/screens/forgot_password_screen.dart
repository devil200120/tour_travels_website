// import 'package:flutter/material.dart';
// import 'package:provider/provider.dart';
//
// import '../providers/auth_provider.dart';
// import '../routes.dart'; // ✅ Added for navigation to reset password screen
// import '../theme.dart';
//
// class ForgotPasswordScreen extends StatefulWidget {
//   const ForgotPasswordScreen({super.key});
//
//   @override
//   State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
// }
//
// class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
//     with SingleTickerProviderStateMixin {
//   final TextEditingController phoneCtrl = TextEditingController();
//   late AnimationController _controller;
//   Animation<double>? _fadeAnimation;
//
//   @override
//   void initState() {
//     super.initState();
//     _controller = AnimationController(
//       vsync: this,
//       duration: const Duration(seconds: 2),
//     );
//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       setState(() {
//         _fadeAnimation = CurvedAnimation(
//           parent: _controller,
//           curve: Curves.easeIn,
//         );
//         _controller.forward();
//       });
//     });
//   }
//
//   @override
//   void dispose() {
//     _controller.dispose();
//     phoneCtrl.dispose();
//     super.dispose();
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     final authProvider = Provider.of<AuthProvider>(context);
//
//     return Scaffold(
//       backgroundColor: AppColors.primary,
//       body: SafeArea(
//         child: Stack(
//           children: [
//             // 🔹 Gradient Background
//             Container(
//               decoration: const BoxDecoration(
//                 gradient: LinearGradient(
//                   colors: [
//                     Color(0xFF1565C0),
//                     Color(0xFF1E88E5),
//                     Color(0xFF42A5F5),
//                   ],
//                   begin: Alignment.topLeft,
//                   end: Alignment.bottomRight,
//                 ),
//               ),
//             ),
//
//             // 🔹 Main Content
//             Align(
//               alignment: Alignment.bottomCenter,
//               child: (_fadeAnimation == null)
//                   ? const Center(
//                       child: CircularProgressIndicator(color: Colors.white),
//                     )
//                   : FadeTransition(
//                       opacity: _fadeAnimation!,
//                       child: Container(
//                         height: MediaQuery.of(context).size.height * 0.75,
//                         width: double.infinity,
//                         decoration: const BoxDecoration(
//                           color: Colors.white,
//                           borderRadius: BorderRadius.only(
//                             topLeft: Radius.circular(40),
//                             topRight: Radius.circular(40),
//                           ),
//                           boxShadow: [
//                             BoxShadow(
//                               color: Colors.black12,
//                               blurRadius: 10,
//                               offset: Offset(0, -5),
//                             ),
//                           ],
//                         ),
//                         child: Padding(
//                           padding: const EdgeInsets.symmetric(
//                             horizontal: 28,
//                             vertical: 40,
//                           ),
//                           child: SingleChildScrollView(
//                             child: Column(
//                               crossAxisAlignment: CrossAxisAlignment.center,
//                               children: [
//                                 const Text(
//                                   "Forgot Password 🔐",
//                                   style: TextStyle(
//                                     fontSize: 26,
//                                     fontWeight: FontWeight.bold,
//                                     color: AppColors.primary,
//                                   ),
//                                   textAlign: TextAlign.center,
//                                 ),
//                                 const SizedBox(height: 10),
//                                 const Text(
//                                   "Enter your registered mobile number or email\nand we’ll send you an OTP to reset your password.",
//                                   style: TextStyle(
//                                     color: Colors.black54,
//                                     fontSize: 15,
//                                     height: 1.5,
//                                   ),
//                                   textAlign: TextAlign.center,
//                                 ),
//                                 const SizedBox(height: 40),
//
//                                 Image.asset(
//                                   'assets/images/forgot_password.png',
//                                   height: 180,
//                                   fit: BoxFit.contain,
//                                 ),
//                                 const SizedBox(height: 30),
//
//                                 // 🔹 Input Field
//                                 Container(
//                                   decoration: BoxDecoration(
//                                     boxShadow: [
//                                       BoxShadow(
//                                         color: Colors.black12.withOpacity(0.05),
//                                         blurRadius: 6,
//                                         offset: const Offset(2, 4),
//                                       ),
//                                     ],
//                                   ),
//                                   child: TextField(
//                                     controller: phoneCtrl,
//                                     keyboardType: TextInputType.emailAddress,
//                                     decoration: InputDecoration(
//                                       hintText:
//                                           "Enter your mobile number or email",
//                                       prefixIcon: const Icon(
//                                         Icons.person_outline,
//                                         color: AppColors.primary,
//                                       ),
//                                       filled: true,
//                                       fillColor: Colors.white,
//                                       border: OutlineInputBorder(
//                                         borderRadius: BorderRadius.circular(14),
//                                         borderSide: const BorderSide(
//                                           color: AppColors.border,
//                                         ),
//                                       ),
//                                       focusedBorder: OutlineInputBorder(
//                                         borderRadius: BorderRadius.circular(14),
//                                         borderSide: const BorderSide(
//                                           color: AppColors.primary,
//                                           width: 1.6,
//                                         ),
//                                       ),
//                                     ),
//                                   ),
//                                 ),
//                                 const SizedBox(height: 40),
//
//                                 // 🔹 Submit Button
//                                 Container(
//                                   width: double.infinity,
//                                   height: 52,
//                                   decoration: BoxDecoration(
//                                     gradient: const LinearGradient(
//                                       colors: [
//                                         Color(0xFF1565C0),
//                                         Color(0xFF42A5F5),
//                                       ],
//                                       begin: Alignment.centerLeft,
//                                       end: Alignment.centerRight,
//                                     ),
//                                     borderRadius: BorderRadius.circular(14),
//                                     boxShadow: [
//                                       BoxShadow(
//                                         color: AppColors.primary.withOpacity(
//                                           0.3,
//                                         ),
//                                         blurRadius: 10,
//                                         offset: const Offset(0, 4),
//                                       ),
//                                     ],
//                                   ),
//                                   child: ElevatedButton(
//                                     onPressed: authProvider.isLoading
//                                         ? null
//                                         : () async {
//                                             final input = phoneCtrl.text.trim();
//
//                                             if (input.isEmpty) {
//                                               ScaffoldMessenger.of(
//                                                 context,
//                                               ).showSnackBar(
//                                                 const SnackBar(
//                                                   content: Text(
//                                                     "⚠️ Please enter your phone or email.",
//                                                   ),
//                                                   backgroundColor:
//                                                       Colors.redAccent,
//                                                 ),
//                                               );
//                                               return;
//                                             }
//
//                                             // ✅ Send to Provider directly — no fake email
//                                             bool success = await authProvider
//                                                 .forgotPassword(input);
//
//                                             if (!mounted) return;
//
//                                             if (success) {
//                                               ScaffoldMessenger.of(
//                                                 context,
//                                               ).showSnackBar(
//                                                 const SnackBar(
//                                                   content: Text(
//                                                     "✅ OTP sent successfully! Please check your phone or email.",
//                                                   ),
//                                                   backgroundColor: Colors.green,
//                                                 ),
//                                               );
//
//                                               // ✅ Navigate to Reset Password Screen
//                                               Navigator.pushReplacementNamed(
//                                                 context,
//                                                 AppRoutes.resetPassword,
//                                                 arguments: input,
//                                               );
//                                             } else {
//                                               ScaffoldMessenger.of(
//                                                 context,
//                                               ).showSnackBar(
//                                                 SnackBar(
//                                                   content: Text(
//                                                     authProvider.errorMessage ??
//                                                         "Failed to send OTP. Please check your number or email.",
//                                                   ),
//                                                   backgroundColor:
//                                                       Colors.redAccent,
//                                                 ),
//                                               );
//                                             }
//                                           },
//                                     style: ElevatedButton.styleFrom(
//                                       backgroundColor: Colors.transparent,
//                                       shadowColor: Colors.transparent,
//                                       shape: RoundedRectangleBorder(
//                                         borderRadius: BorderRadius.circular(14),
//                                       ),
//                                     ),
//                                     child: authProvider.isLoading
//                                         ? const SizedBox(
//                                             height: 24,
//                                             width: 24,
//                                             child: CircularProgressIndicator(
//                                               color: Colors.white,
//                                               strokeWidth: 2,
//                                             ),
//                                           )
//                                         : const Text(
//                                             "SEND OTP",
//                                             style: TextStyle(
//                                               fontSize: 16,
//                                               fontWeight: FontWeight.bold,
//                                               color: Colors.white,
//                                             ),
//                                           ),
//                                   ),
//                                 ),
//                                 const SizedBox(height: 20),
//
//                                 // 🔹 Back to Login
//                                 TextButton.icon(
//                                   onPressed: () {
//                                     Navigator.pop(context);
//                                   },
//                                   icon: const Icon(
//                                     Icons.arrow_back_ios_new,
//                                     size: 16,
//                                     color: AppColors.primary,
//                                   ),
//                                   label: const Text(
//                                     "Back to Login",
//                                     style: TextStyle(
//                                       color: AppColors.primary,
//                                       fontWeight: FontWeight.w600,
//                                       fontSize: 14,
//                                     ),
//                                   ),
//                                 ),
//                               ],
//                             ),
//                           ),
//                         ),
//                       ),
//                     ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

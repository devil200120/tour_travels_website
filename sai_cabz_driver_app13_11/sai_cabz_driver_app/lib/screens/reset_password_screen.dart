// import 'package:flutter/material.dart';
// import 'package:provider/provider.dart';
//
// import '../providers/auth_provider.dart';
// import '../routes.dart';
// import '../theme.dart';
//
// class ResetPasswordScreen extends StatefulWidget {
//   final String? emailOrPhone;
//   const ResetPasswordScreen({super.key, this.emailOrPhone});
//
//   @override
//   State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
// }
//
// class _ResetPasswordScreenState extends State<ResetPasswordScreen>
//     with SingleTickerProviderStateMixin {
//   final otpCtrl = TextEditingController();
//   final passwordCtrl = TextEditingController();
//   final confirmCtrl = TextEditingController();
//   bool _obscure1 = true;
//   bool _obscure2 = true;
//
//   late AnimationController _controller;
//   late Animation<double> _fadeAnimation;
//
//   @override
//   void initState() {
//     super.initState();
//     _controller = AnimationController(
//       vsync: this,
//       duration: const Duration(seconds: 2),
//     );
//     _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
//     _controller.forward();
//   }
//
//   @override
//   void dispose() {
//     _controller.dispose();
//     otpCtrl.dispose();
//     passwordCtrl.dispose();
//     confirmCtrl.dispose();
//     super.dispose();
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     final authProvider = Provider.of<AuthProvider>(context);
//     final size = MediaQuery.of(context).size;
//     final emailOrPhone =
//         widget.emailOrPhone ??
//         ModalRoute.of(context)?.settings.arguments as String? ??
//         "Unknown";
//
//     return Scaffold(
//       backgroundColor: AppColors.primary,
//       body: SafeArea(
//         child: Stack(
//           children: [
//             // 🔹 Background Gradient
//             Container(
//               width: double.infinity,
//               height: size.height,
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
//             // 🔹 Animated Card Section
//             Align(
//               alignment: Alignment.bottomCenter,
//               child: FadeTransition(
//                 opacity: _fadeAnimation,
//                 child: Container(
//                   height: size.height * 0.78,
//                   width: double.infinity,
//                   decoration: BoxDecoration(
//                     color: Colors.white.withOpacity(0.97),
//                     borderRadius: const BorderRadius.only(
//                       topLeft: Radius.circular(40),
//                       topRight: Radius.circular(40),
//                     ),
//                     boxShadow: [
//                       BoxShadow(
//                         color: Colors.black.withOpacity(0.1),
//                         blurRadius: 10,
//                         offset: const Offset(0, -4),
//                       ),
//                     ],
//                   ),
//                   child: Padding(
//                     padding: const EdgeInsets.symmetric(
//                       horizontal: 28,
//                       vertical: 35,
//                     ),
//                     child: SingleChildScrollView(
//                       child: Column(
//                         crossAxisAlignment: CrossAxisAlignment.center,
//                         children: [
//                           const Text(
//                             "Reset Password 🔐",
//                             style: TextStyle(
//                               fontSize: 26,
//                               fontWeight: FontWeight.bold,
//                               color: AppColors.primary,
//                             ),
//                           ),
//                           const SizedBox(height: 8),
//                           Text(
//                             "Reset your password for:\n$emailOrPhone",
//                             textAlign: TextAlign.center,
//                             style: const TextStyle(
//                               color: Colors.black54,
//                               fontSize: 15,
//                             ),
//                           ),
//                           const SizedBox(height: 30),
//
//                           // OTP Illustration
//                           Image.asset(
//                             'assets/images/reset_password.png',
//                             height: 150,
//                             fit: BoxFit.contain,
//                           ),
//                           const SizedBox(height: 30),
//
//                           // 🔹 OTP Field
//                           _inputField(
//                             controller: otpCtrl,
//                             label: "Enter OTP",
//                             icon: Icons.password_rounded,
//                             type: TextInputType.number,
//                           ),
//                           const SizedBox(height: 20),
//
//                           // 🔹 New Password
//                           _inputField(
//                             controller: passwordCtrl,
//                             label: "New Password",
//                             icon: Icons.lock_outline,
//                             obscure: _obscure1,
//                             toggle: () {
//                               setState(() => _obscure1 = !_obscure1);
//                             },
//                           ),
//                           const SizedBox(height: 20),
//
//                           // 🔹 Confirm Password
//                           _inputField(
//                             controller: confirmCtrl,
//                             label: "Confirm Password",
//                             icon: Icons.lock_outline,
//                             obscure: _obscure2,
//                             toggle: () {
//                               setState(() => _obscure2 = !_obscure2);
//                             },
//                           ),
//                           const SizedBox(height: 40),
//
//                           // 🔹 Reset Password Button
//                           Container(
//                             width: double.infinity,
//                             height: 52,
//                             decoration: BoxDecoration(
//                               gradient: const LinearGradient(
//                                 colors: [Color(0xFF1565C0), Color(0xFF42A5F5)],
//                                 begin: Alignment.centerLeft,
//                                 end: Alignment.centerRight,
//                               ),
//                               borderRadius: BorderRadius.circular(14),
//                               boxShadow: [
//                                 BoxShadow(
//                                   color: AppColors.primary.withOpacity(0.3),
//                                   blurRadius: 10,
//                                   offset: const Offset(0, 4),
//                                 ),
//                               ],
//                             ),
//                             child: ElevatedButton(
//                               onPressed: authProvider.isLoading
//                                   ? null
//                                   : () async {
//                                       final otp = otpCtrl.text.trim();
//                                       final pass = passwordCtrl.text.trim();
//                                       final confirm = confirmCtrl.text.trim();
//
//                                       if (otp.isEmpty ||
//                                           pass.isEmpty ||
//                                           confirm.isEmpty) {
//                                         _showSnack(
//                                           "⚠️ Please fill all fields.",
//                                           Colors.redAccent,
//                                         );
//                                         return;
//                                       }
//
//                                       if (pass != confirm) {
//                                         _showSnack(
//                                           "❌ Passwords do not match.",
//                                           Colors.redAccent,
//                                         );
//                                         return;
//                                       }
//
//                                       bool success = await authProvider
//                                           .resetPassword(
//                                             emailOrPhone: emailOrPhone,
//                                             otp: otp,
//                                             newPassword: pass,
//                                           );
//
//                                       if (!mounted) return;
//
//                                       if (success) {
//                                         _showSnack(
//                                           "✅ Password reset successful! Please log in.",
//                                           Colors.green,
//                                         );
//                                         Navigator.pushReplacementNamed(
//                                           context,
//                                           AppRoutes.login,
//                                         );
//                                       } else {
//                                         _showSnack(
//                                           authProvider.errorMessage ??
//                                               "Failed to reset password.",
//                                           Colors.redAccent,
//                                         );
//                                       }
//                                     },
//                               style: ElevatedButton.styleFrom(
//                                 backgroundColor: Colors.transparent,
//                                 shadowColor: Colors.transparent,
//                                 shape: RoundedRectangleBorder(
//                                   borderRadius: BorderRadius.circular(14),
//                                 ),
//                               ),
//                               child: authProvider.isLoading
//                                   ? const SizedBox(
//                                       height: 24,
//                                       width: 24,
//                                       child: CircularProgressIndicator(
//                                         color: Colors.white,
//                                         strokeWidth: 2,
//                                       ),
//                                     )
//                                   : const Text(
//                                       "RESET PASSWORD",
//                                       style: TextStyle(
//                                         fontSize: 16,
//                                         fontWeight: FontWeight.bold,
//                                         color: Colors.white,
//                                       ),
//                                     ),
//                             ),
//                           ),
//                           const SizedBox(height: 25),
//
//                           // 🔹 Back to Login
//                           TextButton.icon(
//                             onPressed: () => Navigator.pushReplacementNamed(
//                               context,
//                               AppRoutes.login,
//                             ),
//                             icon: const Icon(
//                               Icons.arrow_back_ios_new,
//                               size: 16,
//                               color: AppColors.primary,
//                             ),
//                             label: const Text(
//                               "Back to Login",
//                               style: TextStyle(
//                                 color: AppColors.primary,
//                                 fontWeight: FontWeight.w600,
//                                 fontSize: 14,
//                               ),
//                             ),
//                           ),
//                         ],
//                       ),
//                     ),
//                   ),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
//
//   void _showSnack(String msg, Color color) {
//     ScaffoldMessenger.of(
//       context,
//     ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
//   }
//
//   Widget _inputField({
//     required TextEditingController controller,
//     required String label,
//     required IconData icon,
//     bool obscure = false,
//     VoidCallback? toggle,
//     TextInputType type = TextInputType.text,
//   }) {
//     return TextField(
//       controller: controller,
//       keyboardType: type,
//       obscureText: obscure,
//       decoration: InputDecoration(
//         labelText: label,
//         prefixIcon: Icon(icon, color: AppColors.primary),
//         suffixIcon: toggle != null
//             ? IconButton(
//                 icon: Icon(
//                   obscure ? Icons.visibility_off : Icons.visibility,
//                   color: AppColors.primary,
//                 ),
//                 onPressed: toggle,
//               )
//             : null,
//         filled: true,
//         fillColor: Colors.white,
//         border: OutlineInputBorder(
//           borderRadius: BorderRadius.circular(14),
//           borderSide: const BorderSide(color: AppColors.border),
//         ),
//         focusedBorder: OutlineInputBorder(
//           borderRadius: BorderRadius.circular(14),
//           borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
//         ),
//       ),
//     );
//   }
// }

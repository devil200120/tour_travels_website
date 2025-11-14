import 'package:flutter/material.dart';
import '../theme.dart';

class SlideToEnd extends StatefulWidget {
  final VoidCallback onCompleted;
  const SlideToEnd({super.key, required this.onCompleted});

  @override
  State<SlideToEnd> createState() => _SlideToEndState();
}

class _SlideToEndState extends State<SlideToEnd> {
  double _percent = 0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onHorizontalDragUpdate: (d) {
        setState(() {
          _percent = (_percent + d.primaryDelta! / 240).clamp(0, 1);
        });
      },
      onHorizontalDragEnd: (_) {
        if (_percent > 0.95) {
          widget.onCompleted();
          setState(() => _percent = 0);
        } else {
          setState(() => _percent = 0);
        }
      },
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: const Color(0xFF101828),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          children: [
            Center(child: Text("Slide to end trip", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
            Align(
              alignment: Alignment.centerLeft,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 50),
                width: 54 + 240 * _percent,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(.12),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

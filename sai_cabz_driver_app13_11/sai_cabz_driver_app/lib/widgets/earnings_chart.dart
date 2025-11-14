import 'package:flutter/material.dart';
import '../theme.dart';

class EarningsChart extends StatelessWidget {
  final List<double> points; // e.g., [200, 500, 800, 1200]
  const EarningsChart({super.key, required this.points});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x11000000), blurRadius: 8, offset: Offset(0,2))],
      ),
      child: CustomPaint(
        painter: _LineChartPainter(points),
        child: Container(),
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  final List<double> points;
  _LineChartPainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    final paintAxis = Paint()
      ..color = const Color(0xFFE5E7EB)
      ..strokeWidth = 1;

    // Draw horizontal grid lines
    for (int i=0;i<4;i++) {
      final y = size.height * (i/3);
      canvas.drawLine(Offset(0,y), Offset(size.width,y), paintAxis);
    }

    if (points.isEmpty) return;

    final maxVal = points.reduce((a,b) => a>b?a:b);
    final minVal = 0.0;
    final dx = size.width / (points.length-1);
    final path = Path();

    for (int i=0;i<points.length;i++) {
      final x = i*dx;
      final t = (points[i]-minVal) / (maxVal==0?1:maxVal);
      final y = size.height - (t * size.height);
      if (i==0) path.moveTo(x,y); else path.lineTo(x,y);
    }

    final linePaint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;

public class ScreenshotGenerator
{
    private static GraphicsPath CreateRoundedPath(float x, float y, float width, float height, float radius)
    {
        GraphicsPath path = new GraphicsPath();
        float d = radius * 2.0f;
        path.AddArc(x, y, d, d, 180, 90);
        path.AddArc(x + width - d, y, d, d, 270, 90);
        path.AddArc(x + width - d, y + height - d, d, d, 0, 90);
        path.AddArc(x, y + height - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    public struct ScreenMeta
    {
        public string Input;
        public string OutputBase;
        public string Tag;
        public string Title;
        public string Subtitle;

        public ScreenMeta(string input, string outputBase, string tag, string title, string subtitle)
        {
            Input = input;
            OutputBase = outputBase;
            Tag = tag;
            Title = title;
            Subtitle = subtitle;
        }
    }

    public static void GenerateAll(string baseDir)
    {
        ScreenMeta[] items = new ScreenMeta[]
        {
            new ScreenMeta(
                Path.Combine(baseDir, "assets/screenshots/screenshot-1-home.png"),
                "screenshot-1-home",
                "TEMPORAL ORIENTATION",
                "Clear Daily Orientation",
                "Day, date & routine schedule to reduce memory anxiety"
            ),
            new ScreenMeta(
                Path.Combine(baseDir, "assets/screenshots/screenshot-2-carousel.png"),
                "screenshot-2-carousel",
                "LOVED ONES & FAMILY",
                "Cherished Memory Album",
                "Comforting photo cards with gentle voice readouts"
            ),
            new ScreenMeta(
                Path.Combine(baseDir, "assets/screenshots/screenshot-3-reminder.png"),
                "screenshot-3-reminder",
                "DAILY CARE ROUTINES",
                "Voice-Guided Routine Alarms",
                "Spoken alerts for medication, hydration and meals"
            ),
            new ScreenMeta(
                Path.Combine(baseDir, "assets/screenshots/screenshot-4-picture-frame.png"),
                "screenshot-4-picture-frame",
                "BEDSIDE DOCKING",
                "Ambient Picture Frame",
                "Full-screen photo slideshow with peaceful clock display"
            )
        };

        string outDir65 = Path.Combine(baseDir, "assets/screenshots/ios-6.5");
        string outDiriPad = Path.Combine(baseDir, "assets/screenshots/ios-ipad");
        Directory.CreateDirectory(outDir65);
        Directory.CreateDirectory(outDiriPad);

        // 1. Generate iPhone 6.5" Display: 1284 x 2778 and 1242 x 2688
        int w65 = 1284;
        int h65 = 2778;

        foreach (var item in items)
        {
            using (Bitmap bmp = new Bitmap(w65, h65, PixelFormat.Format32bppArgb))
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

                // Gradient background (soft sage/cream)
                using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                    new PointF(0, 0),
                    new PointF(0, h65),
                    Color.FromArgb(255, 246, 248, 246),
                    Color.FromArgb(255, 230, 238, 232)))
                {
                    g.FillRectangle(bgBrush, 0, 0, w65, h65);
                }

                // Tag Pill
                using (Font tagFont = new Font("Segoe UI", 22f, FontStyle.Bold))
                {
                    SizeF tagSize = g.MeasureString(item.Tag, tagFont);
                    float pillW = tagSize.Width + 48f;
                    float pillH = tagSize.Height + 18f;
                    float pillX = (w65 - pillW) / 2.0f;
                    float pillY = 130.0f;

                    using (GraphicsPath pillPath = CreateRoundedPath(pillX, pillY, pillW, pillH, 18f))
                    using (SolidBrush pillBrush = new SolidBrush(Color.FromArgb(255, 218, 234, 224)))
                    {
                        g.FillPath(pillBrush, pillPath);
                    }

                    using (SolidBrush tagTextBrush = new SolidBrush(Color.FromArgb(255, 24, 68, 48)))
                    using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
                    {
                        g.DrawString(item.Tag, tagFont, tagTextBrush, new RectangleF(pillX, pillY + 1f, pillW, pillH), sf);
                    }
                }

                // Title
                using (Font titleFont = new Font("Segoe UI", 58f, FontStyle.Bold))
                using (SolidBrush titleBrush = new SolidBrush(Color.FromArgb(255, 20, 58, 42)))
                using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
                {
                    g.DrawString(item.Title, titleFont, titleBrush, new RectangleF(60f, 220f, w65 - 120f, 130f), sf);
                }

                // Subtitle
                using (Font subFont = new Font("Segoe UI", 32f, FontStyle.Regular))
                using (SolidBrush subBrush = new SolidBrush(Color.FromArgb(255, 78, 102, 90)))
                using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
                {
                    g.DrawString(item.Subtitle, subFont, subBrush, new RectangleF(80f, 350f, w65 - 160f, 100f), sf);
                }

                // Source Image
                using (Image srcImg = Image.FromFile(item.Input))
                {
                    float targetW = 1080f;
                    float targetH = 1920f;
                    float targetX = (w65 - targetW) / 2.0f;
                    float targetY = 530f;

                    // Shadow
                    using (GraphicsPath shadowPath = CreateRoundedPath(targetX + 8f, targetY + 20f, targetW, targetH, 54f))
                    using (SolidBrush shadowBrush = new SolidBrush(Color.FromArgb(40, 0, 0, 0)))
                    {
                        g.FillPath(shadowBrush, shadowPath);
                    }

                    // Border / Bezel
                    using (GraphicsPath borderPath = CreateRoundedPath(targetX - 8f, targetY - 8f, targetW + 16f, targetH + 16f, 58f))
                    using (SolidBrush borderBrush = new SolidBrush(Color.FromArgb(255, 28, 36, 32)))
                    {
                        g.FillPath(borderBrush, borderPath);
                    }

                    // Clip & Draw Image
                    using (GraphicsPath clipPath = CreateRoundedPath(targetX, targetY, targetW, targetH, 50f))
                    {
                        var state = g.Save();
                        g.SetClip(clipPath);
                        g.DrawImage(srcImg, targetX, targetY, targetW, targetH);
                        g.Restore(state);
                    }
                }

                // Save 1284 x 2778
                string file1284 = Path.Combine(outDir65, item.OutputBase + "-1284x2778.png");
                bmp.Save(file1284, ImageFormat.Png);
                Console.WriteLine("Saved: " + file1284);

                // Save 1242 x 2688
                using (Bitmap bmp1242 = new Bitmap(1242, 2688, PixelFormat.Format32bppArgb))
                using (Graphics g1242 = Graphics.FromImage(bmp1242))
                {
                    g1242.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g1242.SmoothingMode = SmoothingMode.HighQuality;
                    g1242.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g1242.DrawImage(bmp, 0, 0, 1242, 2688);

                    string file1242 = Path.Combine(outDir65, item.OutputBase + "-1242x2688.png");
                    bmp1242.Save(file1242, ImageFormat.Png);
                    Console.WriteLine("Saved: " + file1242);
                }
            }
        }

        // 2. Generate iPad 13" Display: 2048 x 2732
        int wiPad = 2048;
        int hiPad = 2732;

        foreach (var item in items)
        {
            using (Bitmap bmp = new Bitmap(wiPad, hiPad, PixelFormat.Format32bppArgb))
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

                using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                    new PointF(0, 0),
                    new PointF(0, hiPad),
                    Color.FromArgb(255, 246, 248, 246),
                    Color.FromArgb(255, 230, 238, 232)))
                {
                    g.FillRectangle(bgBrush, 0, 0, wiPad, hiPad);
                }

                // Tag Pill
                using (Font tagFont = new Font("Segoe UI", 32f, FontStyle.Bold))
                {
                    SizeF tagSize = g.MeasureString(item.Tag, tagFont);
                    float pillW = tagSize.Width + 60f;
                    float pillH = tagSize.Height + 24f;
                    float pillX = (wiPad - pillW) / 2.0f;
                    float pillY = 140.0f;

                    using (GraphicsPath pillPath = CreateRoundedPath(pillX, pillY, pillW, pillH, 24f))
                    using (SolidBrush pillBrush = new SolidBrush(Color.FromArgb(255, 218, 234, 224)))
                    {
                        g.FillPath(pillBrush, pillPath);
                    }

                    using (SolidBrush tagTextBrush = new SolidBrush(Color.FromArgb(255, 24, 68, 48)))
                    using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
                    {
                        g.DrawString(item.Tag, tagFont, tagTextBrush, new RectangleF(pillX, pillY + 1f, pillW, pillH), sf);
                    }
                }

                // Title
                using (Font titleFont = new Font("Segoe UI", 76f, FontStyle.Bold))
                using (SolidBrush titleBrush = new SolidBrush(Color.FromArgb(255, 20, 58, 42)))
                using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
                {
                    g.DrawString(item.Title, titleFont, titleBrush, new RectangleF(100f, 250f, wiPad - 200f, 160f), sf);
                }

                // Subtitle
                using (Font subFont = new Font("Segoe UI", 42f, FontStyle.Regular))
                using (SolidBrush subBrush = new SolidBrush(Color.FromArgb(255, 78, 102, 90)))
                using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
                {
                    g.DrawString(item.Subtitle, subFont, subBrush, new RectangleF(120f, 410f, wiPad - 240f, 120f), sf);
                }

                // Source Image
                using (Image srcImg = Image.FromFile(item.Input))
                {
                    float targetW = 1140f;
                    float targetH = (float)(targetW / ((double)srcImg.Width / srcImg.Height));
                    float targetX = (wiPad - targetW) / 2.0f;
                    float targetY = 570f;

                    using (GraphicsPath shadowPath = CreateRoundedPath(targetX + 10f, targetY + 24f, targetW, targetH, 58f))
                    using (SolidBrush shadowBrush = new SolidBrush(Color.FromArgb(40, 0, 0, 0)))
                    {
                        g.FillPath(shadowBrush, shadowPath);
                    }

                    using (GraphicsPath borderPath = CreateRoundedPath(targetX - 10f, targetY - 10f, targetW + 20f, targetH + 20f, 62f))
                    using (SolidBrush borderBrush = new SolidBrush(Color.FromArgb(255, 28, 36, 32)))
                    {
                        g.FillPath(borderBrush, borderPath);
                    }

                    using (GraphicsPath clipPath = CreateRoundedPath(targetX, targetY, targetW, targetH, 52f))
                    {
                        var state = g.Save();
                        g.SetClip(clipPath);
                        g.DrawImage(srcImg, targetX, targetY, targetW, targetH);
                        g.Restore(state);
                    }
                }

                string fileiPad = Path.Combine(outDiriPad, item.OutputBase + "-2048x2732.png");
                bmp.Save(fileiPad, ImageFormat.Png);
                Console.WriteLine("Saved: " + fileiPad);
            }
        }
    }
}

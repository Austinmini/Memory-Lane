using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;

public class GenerateScreenshotsMaster
{
    private static GraphicsPath CreateRoundedPath(float x, float y, float width, float height, float radius)
    {
        GraphicsPath path = new GraphicsPath();
        float d = radius * 2.0f;
        if (d > width) d = width;
        if (d > height) d = height;

        path.AddArc(x, y, d, d, 180, 90);
        path.AddArc(x + width - d, y, d, d, 270, 90);
        path.AddArc(x + width - d, y + height - d, d, d, 0, 90);
        path.AddArc(x, y + height - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    // Color Palette matching src/constants/colors.ts
    static Color ColorPrimary = Color.FromArgb(255, 30, 77, 56);         // #1E4D38 Deep Evergreen
    static Color ColorPrimaryLight = Color.FromArgb(255, 232, 242, 236);   // #E8F2EC Soft Mint
    static Color ColorPrimaryMuted = Color.FromArgb(255, 45, 90, 71);     // #2D5A47 Sage
    static Color ColorTextPrimary = Color.FromArgb(255, 20, 30, 24);       // #141E18 Near Black
    static Color ColorTextSecondary = Color.FromArgb(255, 62, 79, 69);    // #3E4F45 Charcoal Green
    static Color ColorTextMuted = Color.FromArgb(255, 92, 112, 100);      // #5C7064 Helper
    static Color ColorBorder = Color.FromArgb(255, 204, 214, 206);        // #CCD6CE Sturdy border
    static Color ColorSurface = Color.FromArgb(255, 255, 255, 255);       // #FFFFFF White
    static Color ColorBg = Color.FromArgb(255, 249, 250, 248);            // #F9FAF8 Warm Cream
    static Color ColorSuccess = Color.FromArgb(255, 29, 107, 66);         // #1D6B42 Forest Green
    static Color ColorWarm = Color.FromArgb(255, 184, 107, 20);           // #B86B14 Warm Amber
    static Color ColorWarmLight = Color.FromArgb(255, 254, 246, 237);     // #FEF6ED Cream Amber

    // -------------------------------------------------------------
    // RENDER AUTHENTIC UI SCREENS (1080 x 2340 px)
    // -------------------------------------------------------------
    
    // SCREEN 1: Patient Home Screen with Temporal Orientation & Routines
    public static Bitmap RenderScreenHome(string baseDir)
    {
        int sw = 1080;
        int sh = 2340;
        Bitmap bmp = new Bitmap(sw, sh, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            SetupGraphics(g);
            g.Clear(ColorBg);

            // 1. Top Status Bar Mockup
            DrawSystemStatusBar(g, sw, false);

            // 2. App Top Bar
            float topY = 120f;
            using (Font titleFont = new Font("Segoe UI", 38f, FontStyle.Bold))
            using (SolidBrush titleBrush = new SolidBrush(ColorPrimary))
            {
                g.DrawString("Memory Lane", titleFont, titleBrush, 60f, topY);
            }
            using (Font subFont = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush subBrush = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Daily Cognitive Companion", subFont, subBrush, 64f, topY + 62f);
            }

            // Caregiver lock pill
            float lockW = 210f;
            float lockH = 68f;
            float lockX = sw - 60f - lockW;
            using (GraphicsPath lp = CreateRoundedPath(lockX, topY + 10f, lockW, lockH, 34f))
            using (SolidBrush lb = new SolidBrush(ColorPrimaryLight))
            using (Pen lpen = new Pen(ColorPrimary, 2.5f))
            using (Font lfont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush ltb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(lb, lp);
                g.DrawPath(lpen, lp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Caregiver", lfont, ltb, new RectangleF(lockX, topY + 10f, lockW, lockH), sf);
            }

            // 3. Header Time Widget (Card)
            float cardY = 240f;
            float cardW = sw - 120f;
            float cardH = 430f;
            DrawCard(g, 60f, cardY, cardW, cardH, 32f);

            // Period Pill (Thursday Morning)
            float pillW = 340f;
            float pillH = 64f;
            using (GraphicsPath pp = CreateRoundedPath(90f, cardY + 30f, pillW, pillH, 32f))
            using (SolidBrush pb = new SolidBrush(ColorPrimaryLight))
            using (Font pf = new Font("Segoe UI", 22f, FontStyle.Bold))
            using (SolidBrush ptb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(pb, pp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Thursday Morning", pf, ptb, new RectangleF(90f, cardY + 30f, pillW, pillH), sf);
            }

            // Listen Button
            float btnW = 180f;
            float btnH = 64f;
            float btnX = sw - 90f - btnW;
            using (GraphicsPath bp = CreateRoundedPath(btnX, cardY + 30f, btnW, btnH, 32f))
            using (SolidBrush bb = new SolidBrush(ColorPrimary))
            using (Font bf = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush btb = new SolidBrush(Color.White))
            {
                g.FillPath(bb, bp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Listen", bf, btb, new RectangleF(btnX, cardY + 30f, btnW, btnH), sf);
            }

            // Giant Digital Clock: 10:30 AM
            using (Font clockFont = new Font("Segoe UI", 76f, FontStyle.Bold))
            using (SolidBrush clockBrush = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("10:30 AM", clockFont, clockBrush, 90f, cardY + 125f);
            }

            // Full Date
            using (Font dateFont = new Font("Segoe UI", 30f, FontStyle.Regular))
            using (SolidBrush dateBrush = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Thursday, September 17, 2026", dateFont, dateBrush, 94f, cardY + 280f);
            }

            // Subtle divider
            using (Pen divPen = new Pen(Color.FromArgb(240, 220, 230, 224), 2f))
            {
                g.DrawLine(divPen, 90f, cardY + 345f, sw - 90f, cardY + 345f);
            }

            // Helper note
            using (Font noteFont = new Font("Segoe UI", 20f, FontStyle.Regular))
            using (SolidBrush noteBrush = new SolidBrush(ColorTextMuted))
            {
                g.DrawString("Orientation display active • All routines on schedule", noteFont, noteBrush, 94f, cardY + 365f);
            }

            // 4. Quick Ambient Picture Frame Launcher Card
            float frameY = 705f;
            float frameH = 175f;
            DrawCard(g, 60f, frameY, cardW, frameH, 28f);

            using (Font frameTitleFont = new Font("Segoe UI", 26f, FontStyle.Bold))
            using (SolidBrush frameTitleBrush = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("Ambient Picture Frame", frameTitleFont, frameTitleBrush, 90f, frameY + 28f);
            }
            using (Font frameSubFont = new Font("Segoe UI", 20f, FontStyle.Regular))
            using (SolidBrush frameSubBrush = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Play calming full-screen family photo slideshow", frameSubFont, frameSubBrush, 90f, frameY + 84f);
            }

            float playW = 160f;
            float playH = 60f;
            float playX = sw - 90f - playW;
            using (GraphicsPath playPath = CreateRoundedPath(playX, frameY + 45f, playW, playH, 30f))
            using (SolidBrush playBg = new SolidBrush(ColorPrimaryLight))
            using (Pen playPen = new Pen(ColorPrimary, 2f))
            using (Font playFont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush playTb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(playBg, playPath);
                g.DrawPath(playPen, playPath);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Play >", playFont, playTb, new RectangleF(playX, frameY + 45f, playW, playH), sf);
            }

            // 5. Today's Routine Schedule Header
            float routineY = 920f;
            using (Font rTitleFont = new Font("Segoe UI", 32f, FontStyle.Bold))
            using (SolidBrush rTitleBrush = new SolidBrush(ColorPrimary))
            {
                g.DrawString("Today's Daily Routines", rTitleFont, rTitleBrush, 60f, routineY);
            }
            using (Font rSubFont = new Font("Segoe UI", 20f, FontStyle.Regular))
            using (SolidBrush rSubBrush = new SolidBrush(ColorTextMuted))
            {
                g.DrawString("Gentle spoken announcements when scheduled", rSubFont, rSubBrush, 62f, routineY + 54f);
            }

            // Routine Item 1: Morning Medication (Completed)
            float rCard1Y = 1010f;
            float rCardH = 210f;
            DrawCard(g, 60f, rCard1Y, cardW, rCardH, 28f);

            // Icon & Title
            using (Font itemTitle = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("Morning Medication  8:30 AM", itemTitle, tb, 90f, rCard1Y + 28f);
            }
            using (Font itemSub = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush sb = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Take prescribed daily pills with a fresh glass of water", itemSub, sb, 90f, rCard1Y + 84f);
            }

            // Completed Button
            float doneW = 200f;
            float doneH = 62f;
            float doneX = sw - 90f - doneW;
            using (GraphicsPath donePath = CreateRoundedPath(doneX, rCard1Y + 120f, doneW, doneH, 31f))
            using (SolidBrush doneBg = new SolidBrush(ColorSuccess))
            using (Font doneFont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush doneTb = new SolidBrush(Color.White))
            {
                g.FillPath(doneBg, donePath);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Completed", doneFont, doneTb, new RectangleF(doneX, rCard1Y + 120f, doneW, doneH), sf);
            }

            // Routine Item 2: Hydration (Pending)
            float rCard2Y = 1250f;
            DrawCard(g, 60f, rCard2Y, cardW, rCardH, 28f);
            using (Font itemTitle = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("Hydration Check  11:00 AM", itemTitle, tb, 90f, rCard2Y + 28f);
            }
            using (Font itemSub = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush sb = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Enjoy a tall glass of cool, refreshing water", itemSub, sb, 90f, rCard2Y + 84f);
            }

            using (GraphicsPath markPath = CreateRoundedPath(doneX, rCard2Y + 120f, doneW, doneH, 31f))
            using (SolidBrush markBg = new SolidBrush(ColorPrimaryLight))
            using (Pen markPen = new Pen(ColorPrimary, 2.5f))
            using (Font markFont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush markTb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(markBg, markPath);
                g.DrawPath(markPen, markPath);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Mark Done", markFont, markTb, new RectangleF(doneX, rCard2Y + 120f, doneW, doneH), sf);
            }

            // Routine Item 3: Nutritious Lunch
            float rCard3Y = 1490f;
            DrawCard(g, 60f, rCard3Y, cardW, rCardH, 28f);
            using (Font itemTitle = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("Nutritious Lunch  12:30 PM", itemTitle, tb, 90f, rCard3Y + 28f);
            }
            using (Font itemSub = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush sb = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Enjoy a warm, balanced meal and relaxing cup of tea", itemSub, sb, 90f, rCard3Y + 84f);
            }
            using (GraphicsPath markPath = CreateRoundedPath(doneX, rCard3Y + 120f, doneW, doneH, 31f))
            using (SolidBrush markBg = new SolidBrush(ColorPrimaryLight))
            using (Pen markPen = new Pen(ColorPrimary, 2.5f))
            using (Font markFont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush markTb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(markBg, markPath);
                g.DrawPath(markPen, markPath);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Mark Done", markFont, markTb, new RectangleF(doneX, rCard3Y + 120f, doneW, doneH), sf);
            }

            // Routine Item 4: Family Phone Call
            float rCard4Y = 1730f;
            DrawCard(g, 60f, rCard4Y, cardW, rCardH, 28f);
            using (Font itemTitle = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(ColorTextPrimary))
            {
                g.DrawString("Call Sarah & Leo  3:00 PM", itemTitle, tb, 90f, rCard4Y + 28f);
            }
            using (Font itemSub = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush sb = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Share an afternoon chat and catch up on family stories", itemSub, sb, 90f, rCard4Y + 84f);
            }
            using (GraphicsPath markPath = CreateRoundedPath(doneX, rCard4Y + 120f, doneW, doneH, 31f))
            using (SolidBrush markBg = new SolidBrush(ColorPrimaryLight))
            using (Pen markPen = new Pen(ColorPrimary, 2.5f))
            using (Font markFont = new Font("Segoe UI", 20f, FontStyle.Bold))
            using (SolidBrush markTb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(markBg, markPath);
                g.DrawPath(markPen, markPath);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Mark Done", markFont, markTb, new RectangleF(doneX, rCard4Y + 120f, doneW, doneH), sf);
            }

            // Bottom Navigation Pill Bar Mockup
            DrawHomeIndicator(g, sw, sh);
        }
        return bmp;
    }

    // SCREEN 2: Cherished Memory Album with Family Photo & Narration
    public static Bitmap RenderScreenMemoryAlbum(string baseDir)
    {
        int sw = 1080;
        int sh = 2340;
        Bitmap bmp = new Bitmap(sw, sh, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            SetupGraphics(g);
            g.Clear(ColorBg);
            DrawSystemStatusBar(g, sw, false);

            // App Top Bar
            float topY = 120f;
            using (Font titleFont = new Font("Segoe UI", 36f, FontStyle.Bold))
            using (SolidBrush titleBrush = new SolidBrush(ColorPrimary))
            {
                g.DrawString("Family Memory Album", titleFont, titleBrush, 60f, topY);
            }
            using (Font subFont = new Font("Segoe UI", 22f, FontStyle.Regular))
            using (SolidBrush subBrush = new SolidBrush(ColorTextSecondary))
            {
                g.DrawString("Touch any card or tap listen to hear personal stories", subFont, subBrush, 64f, topY + 60f);
            }

            // Memory Card (Large Elevated Showcase)
            float cardX = 60f;
            float cardY = 240f;
            float cardW = sw - 120f;
            float cardH = 1750f;
            DrawCard(g, cardX, cardY, cardW, cardH, 36f);

            // Photo image
            string imgPath = Path.Combine(baseDir, "assets/defaults/family_portrait.jpg");
            if (File.Exists(imgPath))
            {
                using (Image photo = Image.FromFile(imgPath))
                {
                    float photoH = 1040f;
                    using (GraphicsPath cp = CreateRoundedPath(cardX + 24f, cardY + 24f, cardW - 48f, photoH, 28f))
                    {
                        var st = g.Save();
                        g.SetClip(cp);
                        // Center crop fit
                        g.DrawImage(photo, new RectangleF(cardX + 24f, cardY + 24f, cardW - 48f, photoH));
                        g.Restore(st);
                    }
                }
            }

            // Relationship Tag Pill
            float tagY = cardY + 1090f;
            float tagW = 460f;
            float tagH = 68f;
            using (GraphicsPath tp = CreateRoundedPath(cardX + 36f, tagY, tagW, tagH, 34f))
            using (SolidBrush tb = new SolidBrush(ColorWarmLight))
            using (Pen tpen = new Pen(ColorWarm, 2f))
            using (Font tf = new Font("Segoe UI", 22f, FontStyle.Bold))
            using (SolidBrush ttb = new SolidBrush(ColorWarm))
            {
                g.FillPath(tb, tp);
                g.DrawPath(tpen, tp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Sarah & Leo — Grandchildren", tf, ttb, new RectangleF(cardX + 36f, tagY, tagW, tagH), sf);
            }

            // Story Text
            float textY = tagY + 90f;
            using (Font storyFont = new Font("Segoe UI", 30f, FontStyle.Regular))
            using (SolidBrush storyBrush = new SolidBrush(ColorTextPrimary))
            {
                RectangleF sRect = new RectangleF(cardX + 36f, textY, cardW - 72f, 240f);
                g.DrawString("Sarah is your loving daughter, and little Leo is your energetic grandson. They visit every Sunday afternoon and love making pancakes with you in the kitchen.", storyFont, storyBrush, sRect);
            }

            // Large Voice Readout Button: Listen to Story
            float voiceBtnY = cardY + cardH - 180f;
            float voiceBtnW = cardW - 72f;
            float voiceBtnH = 110f;
            using (GraphicsPath vp = CreateRoundedPath(cardX + 36f, voiceBtnY, voiceBtnW, voiceBtnH, 55f))
            using (SolidBrush vb = new SolidBrush(ColorPrimary))
            using (Font vf = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush vtb = new SolidBrush(Color.White))
            {
                g.FillPath(vb, vp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Listen to Story in Gentle Voice", vf, vtb, new RectangleF(cardX + 36f, voiceBtnY, voiceBtnW, voiceBtnH), sf);
            }

            // Carousel Navigation Controls at Bottom
            float navY = cardY + cardH + 45f;
            float btnWidth = (cardW - 40f) / 2.0f;
            float btnHeight = 90f;

            // Previous Button
            using (GraphicsPath prevP = CreateRoundedPath(cardX, navY, btnWidth, btnHeight, 45f))
            using (SolidBrush prevBg = new SolidBrush(ColorSurface))
            using (Pen prevPen = new Pen(ColorPrimary, 3f))
            using (Font nf = new Font("Segoe UI", 24f, FontStyle.Bold))
            using (SolidBrush ntb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(prevBg, prevP);
                g.DrawPath(prevPen, prevP);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("< Previous Memory", nf, ntb, new RectangleF(cardX, navY, btnWidth, btnHeight), sf);
            }

            // Next Button
            using (GraphicsPath nextP = CreateRoundedPath(cardX + btnWidth + 40f, navY, btnWidth, btnHeight, 45f))
            using (SolidBrush nextBg = new SolidBrush(ColorPrimaryMuted))
            using (Font nf = new Font("Segoe UI", 24f, FontStyle.Bold))
            using (SolidBrush ntb = new SolidBrush(Color.White))
            {
                g.FillPath(nextBg, nextP);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Next Memory >", nf, ntb, new RectangleF(cardX + btnWidth + 40f, navY, btnWidth, btnHeight), sf);
            }

            DrawHomeIndicator(g, sw, sh);
        }
        return bmp;
    }

    // SCREEN 3: Gentle Voice Routine Alert Modal
    public static Bitmap RenderScreenVoiceAlert(string baseDir)
    {
        int sw = 1080;
        int sh = 2340;
        // Start with background blurred patient screen
        Bitmap baseScreen = RenderScreenHome(baseDir);
        Bitmap bmp = new Bitmap(sw, sh, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            SetupGraphics(g);
            g.DrawImage(baseScreen, 0, 0, sw, sh);

            // Dark semi-transparent scrim overlay
            using (SolidBrush scrim = new SolidBrush(Color.FromArgb(160, 18, 28, 22)))
            {
                g.FillRectangle(scrim, 0, 0, sw, sh);
            }

            // Center Elevated Modal Dialog Card
            float modalW = sw - 120f;
            float modalH = 1380f;
            float modalX = 60f;
            float modalY = (sh - modalH) / 2.0f;

            // Modal drop shadow
            using (GraphicsPath sp = CreateRoundedPath(modalX + 10f, modalY + 25f, modalW, modalH, 44f))
            using (SolidBrush sb = new SolidBrush(Color.FromArgb(90, 0, 0, 0)))
            {
                g.FillPath(sb, sp);
            }

            // Modal Card Background
            using (GraphicsPath mp = CreateRoundedPath(modalX, modalY, modalW, modalH, 44f))
            using (SolidBrush mb = new SolidBrush(ColorSurface))
            using (Pen mpen = new Pen(ColorBorder, 3f))
            {
                g.FillPath(mb, mp);
                g.DrawPath(mpen, mp);
            }

            // Header Row: Category Pill & Time
            float headY = modalY + 50f;
            float cpW = 320f;
            float cpH = 64f;
            using (GraphicsPath cp = CreateRoundedPath(modalX + 60f, headY, cpW, cpH, 32f))
            using (SolidBrush cb = new SolidBrush(ColorPrimaryLight))
            using (Font cf = new Font("Segoe UI", 22f, FontStyle.Bold))
            using (SolidBrush ctb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(cb, cp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Daily Medication", cf, ctb, new RectangleF(modalX + 60f, headY, cpW, cpH), sf);
            }

            using (Font tf = new Font("Segoe UI", 24f, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(ColorTextMuted))
            {
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Far, LineAlignment = StringAlignment.Center };
                g.DrawString("8:30 AM", tf, tb, new RectangleF(modalX + modalW - 260f, headY, 200f, cpH), sf);
            }

            // Large Circular Emblem with Drawn Vector Capsule Pill
            float emRadius = 140f;
            float emX = modalX + (modalW - emRadius * 2) / 2.0f;
            float emY = headY + 110f;
            using (SolidBrush embBg = new SolidBrush(ColorPrimaryLight))
            using (Pen embBorder = new Pen(ColorPrimary, 4f))
            {
                g.FillEllipse(embBg, emX, emY, emRadius * 2, emRadius * 2);
                g.DrawEllipse(embBorder, emX, emY, emRadius * 2, emRadius * 2);

                // Draw 2-color Rx Capsule inside circle
                var stPill = g.Save();
                g.TranslateTransform(emX + emRadius, emY + emRadius);
                g.RotateTransform(-40f);

                using (SolidBrush pGreen = new SolidBrush(ColorPrimary))
                using (SolidBrush pAmber = new SolidBrush(ColorWarm))
                using (Pen pLine = new Pen(Color.White, 3f))
                {
                    // Left half (Green)
                    using (GraphicsPath half1 = CreateRoundedPath(-70f, -32f, 70f, 64f, 32f))
                    {
                        g.FillPath(pGreen, half1);
                    }
                    // Right half (Amber)
                    using (GraphicsPath half2 = CreateRoundedPath(0f, -32f, 70f, 64f, 32f))
                    {
                        g.FillPath(pAmber, half2);
                    }
                    g.DrawLine(pLine, 0f, -32f, 0f, 32f);
                }
                g.Restore(stPill);
            }

            // Modal Title
            float titleY = emY + emRadius * 2 + 40f;
            using (Font mf = new Font("Segoe UI", 42f, FontStyle.Bold))
            using (SolidBrush mtb = new SolidBrush(ColorTextPrimary))
            {
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString("Morning Medication", mf, mtb, new RectangleF(modalX + 40f, titleY, modalW - 80f, 70f), sf);
            }

            // Spoken Instruction Speech Bubble
            float bubY = titleY + 95f;
            float bubW = modalW - 100f;
            float bubH = 240f;
            float bubX = modalX + 50f;
            using (GraphicsPath bp = CreateRoundedPath(bubX, bubY, bubW, bubH, 28f))
            using (SolidBrush bb = new SolidBrush(ColorBg))
            using (Pen bpen = new Pen(ColorBorder, 2f))
            {
                g.FillPath(bb, bp);
                g.DrawPath(bpen, bp);
            }
            using (Font sf = new Font("Segoe UI", 28f, FontStyle.Regular))
            using (SolidBrush stb = new SolidBrush(ColorTextSecondary))
            {
                StringFormat sfm = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("\"Good morning! It is time to take your morning medication with a fresh glass of water.\"", sf, stb, new RectangleF(bubX + 30f, bubY + 20f, bubW - 60f, bubH - 40f), sfm);
            }

            // Voice Status Pill (Speaking indicator)
            float statY = bubY + bubH + 35f;
            using (Font stf = new Font("Segoe UI", 22f, FontStyle.Bold))
            using (SolidBrush sttb = new SolidBrush(ColorWarm))
            {
                StringFormat sfm = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString("Spoken audio playing in gentle cadence...", stf, sttb, new RectangleF(modalX + 40f, statY, modalW - 80f, 50f), sfm);
            }

            // Action Button 1: I Have Taken My Medication
            float actBtnY = statY + 75f;
            float actW = modalW - 100f;
            float actH = 110f;
            float actX = modalX + 50f;
            using (GraphicsPath ap = CreateRoundedPath(actX, actBtnY, actW, actH, 55f))
            using (SolidBrush ab = new SolidBrush(ColorSuccess))
            using (Font af = new Font("Segoe UI", 28f, FontStyle.Bold))
            using (SolidBrush atb = new SolidBrush(Color.White))
            {
                g.FillPath(ab, ap);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("✓  I Have Taken It", af, atb, new RectangleF(actX, actBtnY, actW, actH), sf);
            }

            // Action Button 2: Replay Audio
            float repBtnY = actBtnY + actH + 30f;
            using (GraphicsPath rp = CreateRoundedPath(actX, repBtnY, actW, 90f, 45f))
            using (SolidBrush rb = new SolidBrush(ColorSurface))
            using (Pen rpen = new Pen(ColorPrimary, 2.5f))
            using (Font rf = new Font("Segoe UI", 24f, FontStyle.Bold))
            using (SolidBrush rtb = new SolidBrush(ColorPrimary))
            {
                g.FillPath(rb, rp);
                g.DrawPath(rpen, rp);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Replay Voice Instruction", rf, rtb, new RectangleF(actX, repBtnY, actW, 90f), sf);
            }

            DrawHomeIndicator(g, sw, sh);
        }
        baseScreen.Dispose();
        return bmp;
    }

    // SCREEN 4: Ambient Digital Picture Frame Mode
    public static Bitmap RenderScreenPictureFrame(string baseDir)
    {
        int sw = 1080;
        int sh = 2340;
        Bitmap bmp = new Bitmap(sw, sh, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            SetupGraphics(g);

            // Full bleed Lake Tahoe Photo
            string imgPath = Path.Combine(baseDir, "assets/defaults/lake_tahoe.jpg");
            if (File.Exists(imgPath))
            {
                using (Image photo = Image.FromFile(imgPath))
                {
                    g.DrawImage(photo, new Rectangle(0, 0, sw, sh));
                }
            }
            else
            {
                g.Clear(Color.DarkSlateGray);
            }

            // Frosted Clock Glass Card (Top Left)
            float clockX = 60f;
            float clockY = 100f;
            float clockW = 540f;
            float clockH = 240f;
            using (GraphicsPath cp = CreateRoundedPath(clockX, clockY, clockW, clockH, 36f))
            using (SolidBrush cb = new SolidBrush(Color.FromArgb(140, 20, 32, 28)))
            using (Pen cpen = new Pen(Color.FromArgb(160, 255, 255, 255), 2f))
            {
                g.FillPath(cb, cp);
                g.DrawPath(cpen, cp);
            }
            using (Font cf = new Font("Segoe UI", 68f, FontStyle.Bold))
            using (SolidBrush ctb = new SolidBrush(Color.White))
            {
                g.DrawString("10:30 AM", cf, ctb, clockX + 45f, clockY + 28f);
            }
            using (Font df = new Font("Segoe UI", 28f, FontStyle.Regular))
            using (SolidBrush dtb = new SolidBrush(Color.FromArgb(240, 230, 240, 235)))
            {
                g.DrawString("Thursday, Sep 17", df, dtb, clockX + 48f, clockY + 145f);
            }

            // Discreet Exit Pill (Top Right)
            float exitW = 160f;
            float exitH = 68f;
            float exitX = sw - 60f - exitW;
            using (GraphicsPath ep = CreateRoundedPath(exitX, clockY, exitW, exitH, 34f))
            using (SolidBrush eb = new SolidBrush(Color.FromArgb(150, 20, 30, 25)))
            using (Pen epen = new Pen(Color.FromArgb(120, 255, 255, 255), 2f))
            using (Font ef = new Font("Segoe UI", 22f, FontStyle.Bold))
            using (SolidBrush etb = new SolidBrush(Color.White))
            {
                g.FillPath(eb, ep);
                g.DrawPath(epen, ep);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Exit", ef, etb, new RectangleF(exitX, clockY, exitW, exitH), sf);
            }

            // Bottom Caption Pill
            float capW = 680f;
            float capH = 90f;
            float capX = (sw - capW) / 2.0f;
            float capY = sh - 220f;
            using (GraphicsPath capP = CreateRoundedPath(capX, capY, capW, capH, 45f))
            using (SolidBrush capB = new SolidBrush(Color.FromArgb(160, 18, 26, 22)))
            using (Pen capPen = new Pen(Color.FromArgb(130, 255, 255, 255), 2f))
            using (Font capF = new Font("Segoe UI", 26f, FontStyle.Bold))
            using (SolidBrush capTb = new SolidBrush(Color.White))
            {
                g.FillPath(capB, capP);
                g.DrawPath(capPen, capP);
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                g.DrawString("Lake Tahoe Vacation — Family Memories", capF, capTb, new RectangleF(capX, capY, capW, capH), sf);
            }
        }
        return bmp;
    }

    // -------------------------------------------------------------
    // GENERATE FULL MARKETING STORE SCREENSHOT
    // (Wraps authentic screen in beautiful gradient canvas + headlines)
    // -------------------------------------------------------------
    public static void GenerateMarketingAsset(
        Bitmap appScreen,
        string tag,
        string title,
        string subtitle,
        int canvasW,
        int canvasH,
        string outputPath)
    {
        using (Bitmap canvas = new Bitmap(canvasW, canvasH, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(canvas))
        {
            SetupGraphics(g);

            // 1. Soothing Calming Sage & Mint Gradient
            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                new PointF(0, 0),
                new PointF(0, canvasH),
                Color.FromArgb(255, 247, 249, 247),
                Color.FromArgb(255, 226, 236, 229)))
            {
                g.FillRectangle(bgBrush, 0, 0, canvasW, canvasH);
            }

            // Scale factors depending on iPhone (1284x2778) vs iPad (2048x2732)
            bool isiPad = canvasW > 1600;
            float scale = isiPad ? 1.4f : 1.0f;

            // 2. Tag Pill
            using (Font tagFont = new Font("Segoe UI", 22f * scale, FontStyle.Bold))
            {
                SizeF tagSize = g.MeasureString(tag, tagFont);
                float pillW = tagSize.Width + 48f * scale;
                float pillH = tagSize.Height + 18f * scale;
                float pillX = (canvasW - pillW) / 2.0f;
                float pillY = isiPad ? 140f : 120f;

                using (GraphicsPath pillPath = CreateRoundedPath(pillX, pillY, pillW, pillH, 18f * scale))
                using (SolidBrush pillBrush = new SolidBrush(ColorPrimaryLight))
                using (Pen pillPen = new Pen(ColorPrimary, 2f))
                {
                    g.FillPath(pillBrush, pillPath);
                    g.DrawPath(pillPen, pillPath);
                }

                using (SolidBrush tagTextBrush = new SolidBrush(ColorPrimary))
                using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
                {
                    g.DrawString(tag, tagFont, tagTextBrush, new RectangleF(pillX, pillY + 2f, pillW, pillH), sf);
                }
            }

            // 3. Bold Main Headline
            float titleY = isiPad ? 250f : 210f;
            using (Font titleFont = new Font("Segoe UI", 56f * scale, FontStyle.Bold))
            using (SolidBrush titleBrush = new SolidBrush(ColorPrimary))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
            {
                g.DrawString(title, titleFont, titleBrush, new RectangleF(60f * scale, titleY, canvasW - 120f * scale, 140f * scale), sf);
            }

            // 4. Supporting Subtitle
            float subY = isiPad ? 400f : 340f;
            using (Font subFont = new Font("Segoe UI", 30f * scale, FontStyle.Regular))
            using (SolidBrush subBrush = new SolidBrush(ColorTextSecondary))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center })
            {
                g.DrawString(subtitle, subFont, subBrush, new RectangleF(80f * scale, subY, canvasW - 160f * scale, 110f * scale), sf);
            }

            // 5. Authentic Device Chassis & Screen
            float deviceW = isiPad ? 1160f : (canvasW * 0.82f);
            float deviceH = deviceW * (2340f / 1080f);
            float deviceX = (canvasW - deviceW) / 2.0f;
            float deviceY = isiPad ? 580f : (canvasH * 0.20f);

            // Ensure chassis fits within bottom padding
            float maxH = canvasH - deviceY + 80f; // slight bleed allowed at bottom
            if (deviceH > maxH * 1.05f)
            {
                deviceH = maxH * 1.02f;
                deviceW = deviceH * (1080f / 2340f);
                deviceX = (canvasW - deviceW) / 2.0f;
            }

            // Ambient Drop Shadow
            using (GraphicsPath shadowPath = CreateRoundedPath(deviceX + 8f, deviceY + 22f, deviceW, deviceH, 56f))
            using (SolidBrush shadowBrush = new SolidBrush(Color.FromArgb(45, 0, 0, 0)))
            {
                g.FillPath(shadowBrush, shadowPath);
            }

            // Device Outer Bezel
            using (GraphicsPath bezelPath = CreateRoundedPath(deviceX - 10f, deviceY - 10f, deviceW + 20f, deviceH + 20f, 62f))
            using (SolidBrush bezelBrush = new SolidBrush(Color.FromArgb(255, 26, 32, 28)))
            {
                g.FillPath(bezelBrush, bezelPath);
            }

            // Screen Clip & Draw Real App UI
            using (GraphicsPath clipPath = CreateRoundedPath(deviceX, deviceY, deviceW, deviceH, 52f))
            {
                var st = g.Save();
                g.SetClip(clipPath);
                g.DrawImage(appScreen, deviceX, deviceY, deviceW, deviceH);
                g.Restore(st);
            }

            // Inner subtle border
            using (GraphicsPath innerPath = CreateRoundedPath(deviceX, deviceY, deviceW, deviceH, 52f))
            using (Pen innerPen = new Pen(Color.FromArgb(40, 0, 0, 0), 2f))
            {
                g.DrawPath(innerPen, innerPath);
            }

            // Save File as 24bpp RGB (Strict Apple requirement: flat RGB, zero transparency)
            string dir = Path.GetDirectoryName(outputPath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            using (Bitmap flat = new Bitmap(canvasW, canvasH, PixelFormat.Format24bppRgb))
            using (Graphics gFlat = Graphics.FromImage(flat))
            {
                gFlat.InterpolationMode = InterpolationMode.NearestNeighbor;
                gFlat.DrawImage(canvas, 0, 0, canvasW, canvasH);
                flat.Save(outputPath, ImageFormat.Png);
            }
            Console.WriteLine("Successfully created: " + outputPath);
        }
    }

    private static void SetupGraphics(Graphics g)
    {
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.SmoothingMode = SmoothingMode.HighQuality;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
    }

    private static void DrawCard(Graphics g, float x, float y, float w, float h, float r)
    {
        // Shadow
        using (GraphicsPath sp = CreateRoundedPath(x, y + 4f, w, h, r))
        using (SolidBrush sb = new SolidBrush(Color.FromArgb(16, 0, 0, 0)))
        {
            g.FillPath(sb, sp);
        }
        // Card body
        using (GraphicsPath cp = CreateRoundedPath(x, y, w, h, r))
        using (SolidBrush cb = new SolidBrush(ColorSurface))
        using (Pen cpen = new Pen(ColorBorder, 2f))
        {
            g.FillPath(cb, cp);
            g.DrawPath(cpen, cp);
        }
    }

    private static void DrawSystemStatusBar(Graphics g, int sw, bool dark)
    {
        Color col = dark ? Color.White : ColorTextPrimary;
        using (Font timeFont = new Font("Segoe UI", 24f, FontStyle.Bold))
        using (SolidBrush brush = new SolidBrush(col))
        {
            g.DrawString("9:41", timeFont, brush, 80f, 40f);
            StringFormat sf = new StringFormat { Alignment = StringAlignment.Far };
            g.DrawString("📶  🔋", timeFont, brush, sw - 80f, 40f, sf);
        }
        // Dynamic Island
        float diW = 220f;
        float diH = 48f;
        float diX = (sw - diW) / 2.0f;
        using (GraphicsPath dip = CreateRoundedPath(diX, 36f, diW, diH, 24f))
        using (SolidBrush dib = new SolidBrush(Color.FromArgb(255, 14, 18, 16)))
        {
            g.FillPath(dib, dip);
        }
    }

    private static void DrawHomeIndicator(Graphics g, int sw, int sh)
    {
        float hiW = 280f;
        float hiH = 8f;
        float hiX = (sw - hiW) / 2.0f;
        float hiY = sh - 28f;
        using (GraphicsPath hip = CreateRoundedPath(hiX, hiY, hiW, hiH, 4f))
        using (SolidBrush hib = new SolidBrush(Color.FromArgb(140, 40, 50, 44)))
        {
            g.FillPath(hib, hip);
        }
    }

    public static void Main(string[] args)
    {
        string baseDir = args.Length > 0 ? args[0] : Directory.GetCurrentDirectory();
        Console.WriteLine("Generating Master App Store Screenshots for Memory Lane at: " + baseDir);

        // 1. Render Authentic App UI Screens
        Console.WriteLine("Rendering Screen 1: Patient Home...");
        Bitmap screenHome = RenderScreenHome(baseDir);
        string raw1 = Path.Combine(baseDir, "assets/screenshots/screenshot-1-home.png");
        screenHome.Save(raw1, ImageFormat.Png);

        Console.WriteLine("Rendering Screen 2: Memory Album...");
        Bitmap screenAlbum = RenderScreenMemoryAlbum(baseDir);
        string raw2 = Path.Combine(baseDir, "assets/screenshots/screenshot-2-carousel.png");
        screenAlbum.Save(raw2, ImageFormat.Png);

        Console.WriteLine("Rendering Screen 3: Spoken Voice Routine Alert...");
        Bitmap screenAlert = RenderScreenVoiceAlert(baseDir);
        string raw3 = Path.Combine(baseDir, "assets/screenshots/screenshot-3-reminder.png");
        screenAlert.Save(raw3, ImageFormat.Png);

        Console.WriteLine("Rendering Screen 4: Bedside Picture Frame...");
        Bitmap screenFrame = RenderScreenPictureFrame(baseDir);
        string raw4 = Path.Combine(baseDir, "assets/screenshots/screenshot-4-picture-frame.png");
        screenFrame.Save(raw4, ImageFormat.Png);

        // 2. Generate iPhone with Dynamic Island (medium display) -> EXACTLY 1179 x 2556 px
        string dirMedium = Path.Combine(baseDir, "assets/screenshots/ios-dynamic-island-medium");
        Console.WriteLine("Generating iPhone with Dynamic Island (medium display - 1179 x 2556)...");
        GenerateMarketingAsset(screenHome, "TEMPORAL ORIENTATION", "Clear Daily Orientation", "Day, date & routine schedule to reduce memory anxiety", 1179, 2556, Path.Combine(dirMedium, "screenshot-1-home-1179x2556.png"));
        GenerateMarketingAsset(screenAlbum, "CHERISHED MEMORIES", "Family Memory Album", "Comforting photo cards with gentle one-tap voice readouts", 1179, 2556, Path.Combine(dirMedium, "screenshot-2-carousel-1179x2556.png"));
        GenerateMarketingAsset(screenAlert, "DAILY CARE ROUTINES", "Voice-Guided Routine Alarms", "Spoken alerts for medication, hydration and wholesome meals", 1179, 2556, Path.Combine(dirMedium, "screenshot-3-reminder-1179x2556.png"));
        GenerateMarketingAsset(screenFrame, "BEDSIDE DOCKING", "Ambient Digital Picture Frame", "Full-screen photo slideshow with peaceful clock display", 1179, 2556, Path.Combine(dirMedium, "screenshot-4-picture-frame-1179x2556.png"));

        // Also generate 1206 x 2622 for iPhone 16 Pro medium display
        foreach (var file in Directory.GetFiles(dirMedium, "*-1179x2556.png"))
        {
            string out1206 = file.Replace("1179x2556", "1206x2622");
            using (Image src = Image.FromFile(file))
            using (Bitmap scaled = new Bitmap(1206, 2622, PixelFormat.Format24bppRgb))
            using (Graphics g = Graphics.FromImage(scaled))
            {
                SetupGraphics(g);
                g.DrawImage(src, 0, 0, 1206, 2622);
                scaled.Save(out1206, ImageFormat.Png);
            }
            Console.WriteLine("Saved: " + out1206);
        }

        // 3. Generate iPhone 6.5" / 6.7" (1284 x 2778)
        string dir65 = Path.Combine(baseDir, "assets/screenshots/ios-6.5");
        Console.WriteLine("Generating iPhone 6.5\" & 6.7\" Marketing Sets...");
        GenerateMarketingAsset(screenHome, "TEMPORAL ORIENTATION", "Clear Daily Orientation", "Day, date & routine schedule to reduce memory anxiety", 1284, 2778, Path.Combine(dir65, "screenshot-1-home-1284x2778.png"));
        GenerateMarketingAsset(screenAlbum, "CHERISHED MEMORIES", "Family Memory Album", "Comforting photo cards with gentle one-tap voice readouts", 1284, 2778, Path.Combine(dir65, "screenshot-2-carousel-1284x2778.png"));
        GenerateMarketingAsset(screenAlert, "DAILY CARE ROUTINES", "Voice-Guided Routine Alarms", "Spoken alerts for medication, hydration and wholesome meals", 1284, 2778, Path.Combine(dir65, "screenshot-3-reminder-1284x2778.png"));
        GenerateMarketingAsset(screenFrame, "BEDSIDE DOCKING", "Ambient Digital Picture Frame", "Full-screen photo slideshow with peaceful clock display", 1284, 2778, Path.Combine(dir65, "screenshot-4-picture-frame-1284x2778.png"));

        // 4. Generate iPad 13" Display (2048 x 2732)
        string dirIpad = Path.Combine(baseDir, "assets/screenshots/ios-ipad");
        Console.WriteLine("Generating iPad 13\" Marketing Sets...");
        GenerateMarketingAsset(screenHome, "TEMPORAL ORIENTATION", "Clear Daily Orientation", "Day, date & routine schedule to reduce memory anxiety", 2048, 2732, Path.Combine(dirIpad, "screenshot-1-home-2048x2732.png"));
        GenerateMarketingAsset(screenAlbum, "CHERISHED MEMORIES", "Family Memory Album", "Comforting photo cards with gentle one-tap voice readouts", 2048, 2732, Path.Combine(dirIpad, "screenshot-2-carousel-2048x2732.png"));
        GenerateMarketingAsset(screenAlert, "DAILY CARE ROUTINES", "Voice-Guided Routine Alarms", "Spoken alerts for medication, hydration and wholesome meals", 2048, 2732, Path.Combine(dirIpad, "screenshot-3-reminder-2048x2732.png"));
        GenerateMarketingAsset(screenFrame, "BEDSIDE DOCKING", "Ambient Digital Picture Frame", "Full-screen photo slideshow with peaceful clock display", 2048, 2732, Path.Combine(dirIpad, "screenshot-4-picture-frame-2048x2732.png"));

        // 5. Generate iPhone Duo (1398 x 2034 and 2007 x 2853)
        string dirDuo = Path.Combine(baseDir, "assets/screenshots/ios-iphone-duo");
        Console.WriteLine("Generating iPhone Duo Marketing Sets (1398 x 2034)...");
        GenerateMarketingAsset(screenHome, "TEMPORAL ORIENTATION", "Clear Daily Orientation", "Day, date & routine schedule to reduce memory anxiety", 1398, 2034, Path.Combine(dirDuo, "screenshot-1-home-1398x2034.png"));
        GenerateMarketingAsset(screenAlbum, "CHERISHED MEMORIES", "Family Memory Album", "Comforting photo cards with gentle one-tap voice readouts", 1398, 2034, Path.Combine(dirDuo, "screenshot-2-carousel-1398x2034.png"));
        GenerateMarketingAsset(screenAlert, "DAILY CARE ROUTINES", "Voice-Guided Routine Alarms", "Spoken alerts for medication, hydration and wholesome meals", 1398, 2034, Path.Combine(dirDuo, "screenshot-3-reminder-1398x2034.png"));
        GenerateMarketingAsset(screenFrame, "BEDSIDE DOCKING", "Ambient Digital Picture Frame", "Full-screen photo slideshow with peaceful clock display", 1398, 2034, Path.Combine(dirDuo, "screenshot-4-picture-frame-1398x2034.png"));

        // Also scale to 2007 x 2853
        foreach (var file in Directory.GetFiles(dirDuo, "*-1398x2034.png"))
        {
            string out2853 = file.Replace("1398x2034", "2007x2853");
            using (Image src = Image.FromFile(file))
            using (Bitmap scaled = new Bitmap(2007, 2853, PixelFormat.Format24bppRgb))
            using (Graphics g = Graphics.FromImage(scaled))
            {
                SetupGraphics(g);
                g.DrawImage(src, 0, 0, 2007, 2853);
                scaled.Save(out2853, ImageFormat.Png);
            }
            Console.WriteLine("Saved: " + out2853);
        }

        // Clean up
        screenHome.Dispose();
        screenAlbum.Dispose();
        screenAlert.Dispose();
        screenFrame.Dispose();

        Console.WriteLine("ALL APP STORE SCREENSHOTS GENERATED SUCCESSFULLY!");
    }
}

# -*- coding: utf-8 -*-
import os, subprocess, sys, math

FF = r"C:\Users\bitcamp\Desktop\yoonjeongho-ax\node_modules\ffmpeg-static\ffmpeg.exe"
BUILD = os.path.dirname(os.path.abspath(__file__))
os.chdir(BUILD)
SEG = "seg"
os.makedirs(SEG, exist_ok=True)
FPS = 30
XF = 0.8           # crossfade duration
FONT = "malgunbd.ttf"

CLIP1 = r"C:\Users\bitcamp\Desktop\0619_오전\KakaoTalk_20260616_190451457.mp4"
CLIP2 = r"C:\Users\bitcamp\Desktop\0619_오전\KakaoTalk_20260616_190743669.mp4"

def run(args):
    p = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y"] + args)
    if p.returncode != 0:
        raise SystemExit("ffmpeg failed: " + " ".join(args[:6]))

def draw(txtfile, fontsize=50, y="h-text_h-110"):
    return (f"drawtext=fontfile={FONT}:textfile=txt/{txtfile}.txt:fontcolor=white:"
            f"fontsize={fontsize}:line_spacing=12:borderw=3:bordercolor=black@0.92:"
            f"box=1:boxcolor=black@0.40:boxborderw=24:x=(w-text_w)/2:y={y}")

def draw_timed(txtfile, a, b, fontsize=52, y="h-text_h-110"):
    return (f"drawtext=fontfile={FONT}:textfile=txt/{txtfile}.txt:fontcolor=white:"
            f"fontsize={fontsize}:line_spacing=12:borderw=3:bordercolor=black@0.92:"
            f"box=1:boxcolor=black@0.40:boxborderw=24:x=(w-text_w)/2:y={y}:"
            f"enable='between(t,{a},{b})'")

# ---- segment definitions ----
# kind: 'land' (ken burns photo), 'port' (blur-bg still), 'clip' (video)
# zoom: 'in'/'out' for land
SEGMENTS = [
    # ===== Act 1 =====
    dict(id="01", kind="land", src="src/p5.jpg", dur=7.5, zoom="in",  cap=[draw("s_p5", 50)]),
    dict(id="02", kind="land", src="src/p4.jpg", dur=6.5, zoom="out", cap=[draw("s_p4", 54)]),
    dict(id="03", kind="land", src="src/p3.jpg", dur=6.5, zoom="in",  cap=[draw("s_p3", 54)]),
    dict(id="04", kind="port", src="src/p2.jpg", dur=7.0,             cap=[draw("s_p2a", 50)]),
    # ===== Act 2 =====  clip1 with 3 timed name captions
    dict(id="05", kind="clip", src=CLIP1, ss=10, dur=30.0,
         cap=[draw_timed("s_n1", 1.0, 10.0, 56), draw_timed("s_n2", 10.0, 19.0, 56),
              draw_timed("s_n3", 19.0, 29.5, 56)]),
    dict(id="06", kind="port", src="src/b7.jpg",  dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="07", kind="port", src="src/b8.jpg",  dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="08", kind="port", src="src/b9.jpg",  dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="09", kind="port", src="src/b10.jpg", dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="10", kind="port", src="src/b11.jpg", dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="11", kind="port", src="src/b12.jpg", dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="12", kind="port", src="src/b13.jpg", dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="13", kind="port", src="src/bjoo.jpg",dur=2.6, cap=[draw("s_bro", 48)]),
    dict(id="14", kind="port", src="src/b21.jpg", dur=2.6, cap=[draw("s_bro", 48)]),
    # ===== Act 3 =====
    dict(id="15", kind="land", src="src/s28.jpg", dur=8.5, zoom="in",  cap=[draw("s_uni", 50)]),
    dict(id="16", kind="port", src="src/s20.jpg", dur=8.0,             cap=[draw("s_uni", 50)]),
    dict(id="17", kind="land", src="src/s26.jpg", dur=7.5,  zoom="out", cap=[]),
    dict(id="18", kind="land", src="src/p14.jpg", dur=8.0, zoom="in",  cap=[draw("s_youth", 52)]),
    dict(id="19", kind="land", src="src/p22.jpg", dur=8.0, zoom="out", cap=[draw("s_youth", 52)]),
    dict(id="20", kind="land", src="src/p19.jpg", dur=8.0, zoom="in",  cap=[draw("s_love", 54)]),
    dict(id="21", kind="land", src="src/s9.jpg",  dur=8.5, zoom="out", cap=[draw("s_serve", 50)]),
    dict(id="22", kind="land", src="src/s42.jpg", dur=8.5, zoom="in",  cap=[draw("s_serve", 50)]),
    # ===== Act 4 =====
    dict(id="23", kind="clip", src=CLIP2, ss=140, dur=10.5, cap=[draw("s_pray", 52)]),
    dict(id="24", kind="land", src="src/s42.jpg", dur=8.0, zoom="out", cap=[draw("s_glory", 50)]),
    dict(id="25", kind="land", src="src/s5.jpg",  dur=10.0, zoom="in",  cap=[draw("s_zeph", 46)]),
    dict(id="26", kind="port", src="src/p2.jpg",  dur=8.5,            cap=[draw("s_title", 50)]),
    dict(id="27", kind="land", src="src/s5.jpg",  dur=12.0, zoom="out", cap=[draw("s_end", 50)]),
]

def land_filter(dur, zoom):
    N = int(round(dur * FPS))
    inc = 0.12 / N
    if zoom == "in":
        z = f"min(1.0+{inc:.7f}*on,1.12)"
    else:
        z = f"max(1.12-{inc:.7f}*on,1.0)"
    return (f"scale=2688:1512:force_original_aspect_ratio=increase,crop=2688:1512,"
            f"zoompan=z='{z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s=1920x1080:fps={FPS},setsar=1")

def port_filter():
    return ("split=2[bg][fg];"
            "[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
            "boxblur=26:3,eq=brightness=-0.06[bgb];"
            "[fg]scale=-2:1004:flags=lanczos[fgs];"
            "[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1")

def clip_filter():
    return ("[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
            "boxblur=22:3,eq=brightness=-0.05[bg];"
            "[0:v]scale=1664:936:flags=lanczos,unsharp=5:5:0.6:5:5:0.0[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30,setsar=1")

def render_segment(s):
    out = f"{SEG}/{s['id']}.mp4"
    dur = s["dur"]
    caps = ",".join(s["cap"]) if s["cap"] else None
    if s["kind"] == "clip":
        base = clip_filter()
        fc = base + ("," + caps if caps else "") + ",format=yuv420p[v]"
        args = ["-ss", str(s["ss"]), "-t", f"{dur}", "-i", s["src"],
                "-filter_complex", fc, "-map", "[v]", "-an",
                "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                "-pix_fmt", "yuv420p", out]
    elif s["kind"] == "port":
        base = port_filter()
        fc = base + ("," + caps if caps else "") + ",format=yuv420p[v]"
        args = ["-loop", "1", "-framerate", "30", "-t", f"{dur}", "-i", s["src"],
                "-filter_complex", fc, "-map", "[v]",
                "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                "-pix_fmt", "yuv420p", out]
    else:  # land
        base = land_filter(dur, s["zoom"])
        vf = base + ("," + caps if caps else "") + ",format=yuv420p"
        args = ["-loop", "1", "-framerate", "30", "-t", f"{dur}", "-i", s["src"],
                "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                "-pix_fmt", "yuv420p", out]
    run(args)
    return out

def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    force = os.environ.get("FORCE", "")
    for s in SEGMENTS:
        if only and s["id"] != only:
            continue
        out = f"{SEG}/{s['id']}.mp4"
        if os.path.exists(out) and not only and s["id"] not in force:
            print("skip (exists)", s["id"], flush=True)
            continue
        print("rendering", s["id"], s["kind"], s["src"], f"{s['dur']}s", flush=True)
        render_segment(s)
    # total
    total = sum(s["dur"] for s in SEGMENTS) - (len(SEGMENTS) - 1) * XF
    print(f"\nSEGMENTS={len(SEGMENTS)}  raw_sum={sum(s['dur'] for s in SEGMENTS):.1f}s  "
          f"final~{total:.1f}s ({int(total//60)}:{total%60:04.1f})")
    if only:
        return
    # build xfade chain
    inputs = []
    for s in SEGMENTS:
        inputs += ["-i", f"{SEG}/{s['id']}.mp4"]
    fc = []
    prev = "0:v"
    acc = SEGMENTS[0]["dur"]
    for i in range(1, len(SEGMENTS)):
        off = acc - XF
        out = f"x{i}"
        fc.append(f"[{prev}][{i}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[{out}]")
        prev = out
        acc = acc + SEGMENTS[i]["dur"] - XF
    final_len = acc
    fc.append(f"[{prev}]fade=t=in:st=0:d=1.2,fade=t=out:st={final_len-2.8:.3f}:d=2.8,"
              f"format=yuv420p[v]")
    graph = ";".join(fc)
    open("xfade_graph.txt", "w", encoding="utf-8").write(graph)
    print("building xfade chain -> video_noaudio.mp4 ...", flush=True)
    run(inputs + ["-filter_complex", graph, "-map", "[v]",
                  "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                  "-pix_fmt", "yuv420p", "-r", "30", "video_noaudio.mp4"])
    with open("final_len.txt", "w") as f:
        f.write(f"{final_len:.3f}")
    print(f"DONE video_noaudio.mp4  len={final_len:.2f}s")

if __name__ == "__main__":
    main()

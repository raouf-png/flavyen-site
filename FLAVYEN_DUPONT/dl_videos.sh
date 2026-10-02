#!/bin/zsh
# Download every project video, up to 2048 px wide, next to its INFO.txt.
cd "${0:A:h}"
while read dir n url; do
  sleep 20; yt-dlp -q --no-warnings --referer https://flavyendupont.com/ \
    -f "bv*[width<=2048]+ba/b[width<=2048]/bv*+ba/b" --merge-output-format mp4 \
    -o "$dir/video_0${n}.%(ext)s" "$url" && echo "OK $dir $n" || echo "FAIL $dir $n $url"
done < ${1:-video_list.txt}
echo ALL_DONE

#include <cmath>
#include <algorithm>
#include <pybind11/numpy.h>

using namespace std;

// template <typename T>
// constexpr const T& clamp(const T& v, const T& lo, const T& hi) {
//     return (v < lo) ? lo : (hi < v) ? hi : v;
// }


void rgb_to_hsl(float r, float g, float b, float& h, float& s, float& l) {
    float max = std::max({r, g, b});
    float min = std::min({r, g, b});
    l = (max + min) / 2.0f;

    if (max == min) {
        h = s = 0.0f;
    } else {
        float d = max - min;
        s = l > 0.5f ? d / (2.0f - max - min) : d / (max + min);

        if (max == r)      h = (g - b) / d + (g < b ? 6 : 0);
        else if (max == g) h = (b - r) / d + 2;
        else               h = (r - g) / d + 4;

        h /= 6.0f;
    }
}

void hsl_to_rgb(float h, float s, float l, float& r, float& g, float& b) {
    auto hue2rgb = [](float p, float q, float t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6.0f) return p + (q - p) * 6 * t;
        if (t < 1/2.0f) return q;
        if (t < 2/3.0f) return p + (q - p) * (2/3.0f - t) * 6;
        return p;
    };

    if (s == 0) {
        r = g = b = l;
    } else {
        float q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        float p = 2 * l - q;
        r = hue2rgb(p, q, h + 1.0f/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0f/3);
    }
}

pybind11::array_t<uint8_t> apply_hsl_adjustment(pybind11::array_t<uint8_t> input, float hue_shift, float sat_scale, float light_scale) {
    auto buf = input.request();
    uint8_t* ptr = (uint8_t*) buf.ptr;
    int w = buf.shape[1];
    int h = buf.shape[0];
    int ch = buf.shape[2];

    pybind11::array_t<uint8_t> output = pybind11::array_t<uint8_t>({h, w, ch});
    auto r = output.mutable_unchecked<3>();

    for (int y = 0; y < h; ++y) {
        for (int x = 0; x < w; ++x) {
            float r0 = ptr[(y*w + x)*ch + 0] / 255.0f;
            float g0 = ptr[(y*w + x)*ch + 1] / 255.0f;
            float b0 = ptr[(y*w + x)*ch + 2] / 255.0f;

            float h_, s_, l_;
            rgb_to_hsl(r0, g0, b0, h_, s_, l_);
            h_ += hue_shift / 360.0f;
            s_ *= sat_scale;
            l_ *= light_scale;

            float rr, gg, bb;
            hsl_to_rgb(fmod(h_, 1.0f), std::clamp(s_, 0.0f, 1.0f), std::clamp(l_, 0.0f, 1.0f), rr, gg, bb);

            r(y, x, 0) = (uint8_t)(rr * 255);
            r(y, x, 1) = (uint8_t)(gg * 255);
            r(y, x, 2) = (uint8_t)(bb * 255);
            if (ch == 4)
                r(y, x, 3) = ptr[(y*w + x)*ch + 3];
        }
    }
    return output;
}

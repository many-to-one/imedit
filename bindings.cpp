// #include <pybind11/pybind11.h>
// #include "editor.cpp"

// // deklaracja funkcji (jeśli jest w innym pliku)
// pybind11::array_t<uint8_t> apply_hsl_adjustment(pybind11::array_t<uint8_t> input, float hue_shift, float sat_scale, float light_scale);

// namespace py = pybind11;

// PYBIND11_MODULE(photoedit, m) {
//     m.doc() = "Photo editing module using pybind11";
    
//     // przykład: dodanie funkcji z C++
//     m.def("apply_hsl_adjustment", &apply_hsl_adjustment,
//           py::arg("input"),
//           py::arg("hue_shift"),
//           py::arg("sat_scale"),
//           py::arg("light_scale"),
//           "Apply HSL adjustment to image"
//         );
// }


#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>

// Deklaracja funkcji (zdefiniowanej w editor.cpp)
pybind11::array_t<uint8_t> apply_hsl_adjustment(pybind11::array_t<uint8_t> input, float hue_shift, float sat_scale, float light_scale);

namespace py = pybind11;

PYBIND11_MODULE(photoedit, m) {
    m.doc() = "Photo editing module";
    m.def("apply_hsl_adjustment", &apply_hsl_adjustment,
          py::arg("input"), py::arg("hue_shift"), py::arg("sat_scale"), py::arg("light_scale"),
          "Apply HSL adjustment to image");
}


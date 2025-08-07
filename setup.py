from setuptools import setup, Extension, find_packages
import pybind11
import sysconfig


ext_modules = [
    Extension(
        "photoedit",
        ["bindings.cpp", "editor.cpp"],
        include_dirs=[
            pybind11.get_include(),
            sysconfig.get_paths()["include"],
            "backend"
        ],
        language="c++",
        extra_compile_args=["/std:c++17"]
    )
]

setup(
    name="photoedit",
    version="0.1.0",
    description="Image Editor in C++ with pybind11",
    ext_modules=ext_modules,
    zip_safe=False,
    # packages=find_packages(include=['backend', 'frontend']),
)


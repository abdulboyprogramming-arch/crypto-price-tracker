#!/usr/bin/env python3
"""
Crypto Tracker Pro - Python CLI Package
Command-line interface for cryptocurrency price tracking
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="crypto-tracker-cli",
    version="2.0.0",
    author="Abdulrahman Adeeyo (Abdulboy)",
    author_email="adeeyoabdulrahman@gmail.com",
    description="Professional cryptocurrency price tracker CLI tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/abdulboyprogramming-arch/crypto-price-tracker",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "rich>=13.0.0",
    ],
    entry_points={
        "console_scripts": [
            "crypto-tracker=crypto_tracker.cli:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)

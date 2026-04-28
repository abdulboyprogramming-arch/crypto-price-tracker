#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER - Python Package Setup
For distribution on PyPI (pip install crypto-price-tracker)
"""

from setuptools import setup, find_packages
import os

# Read README for long description
readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
with open(readme_path, 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='crypto-price-tracker',
    version='1.0.0',
    author='Abdulrahman Adeeyo (Abdulboy)',
    author_email='adeeyoabdulrahman@gmail.com',
    description='Real-time cryptocurrency price tracker with zero external APIs - Direct web scraping',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/abdulboyprogramming-arch/crypto-price-tracker',
    packages=find_packages(),
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Intended Audience :: Financial and Insurance Industry',
        'Topic :: Office/Business :: Financial :: Investment',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
    python_requires='>=3.8',
    install_requires=[],  # No external dependencies!
    entry_points={
        'console_scripts': [
            'crypto-tracker=crypto_tracker.cli:main',
            'crypto-api=crypto_tracker.api_server:main',
        ],
    },
    include_package_data=True,
    zip_safe=False,
)

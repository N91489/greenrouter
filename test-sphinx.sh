#!/bin/bash

# Create a test notebook
cat > /tmp/test-notebook.ipynb << 'EOF'
{
  "cells": [
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
        "import pandas as pd\n",
        "\n",
        "data = {\n",
        "    'route': ['Route 1', 'Route 2', 'Route 3'],\n",
        "    'co2': [214.8, 232.1, 198.5],\n",
        "    'cost': [12500, 11800, 13200]\n",
        "}\n",
        "\n",
        "df = pd.DataFrame(data)\n",
        "print(df)"
      ]
    }
  ],
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 4
}
EOF
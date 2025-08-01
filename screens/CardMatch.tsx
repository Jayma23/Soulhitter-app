import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

const GRID_SIZE = 8;
const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);

// 🎨 CUSTOMIZABLE CARD TYPES - Easy to modify!
const CARD_SETS = {
    animals: {
        name: "Animals",
        cards: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
    },
    fruits: {
        name: "Fruits",
        cards: ['🍎', '🍊', '🍌', '🍇', '🍓', '🥝', '🍑', '🥭']
    },
    gems: {
        name: "Gems",
        cards: ['💎', '💍', '👑', '🔮', '⭐', '✨', '🌟', '💫']
    },
    food: {
        name: "Food",
        cards: ['🍕', '🍔', '🍟', '🌭', '🍰', '🍪', '🍩', '🧁']
    },
    vehicles: {
        name: "Vehicles",
        cards: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑']
    }
};

type Card = {
    type: string;
    id: string;
    row: number;
    col: number;
    isMatched: boolean;
    isSelected: boolean;
};

type GameSettings = {
    cardCount: number;
    cardSet: keyof typeof CARD_SETS;
    gridSize: number;
};

export default function CustomizableCardMatch() {
    const [grid, setGrid] = useState<Card[][]>([]);
    const [score, setScore] = useState(0);
    const [selectedCards, setSelectedCards] = useState<{row: number, col: number}[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [moves, setMoves] = useState(20);
    const [gameOver, setGameOver] = useState(false);
    const [level, setLevel] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [gameSettings, setGameSettings] = useState<GameSettings>({
        cardCount: 5,
        cardSet: 'animals',
        gridSize: 8
    });

    const gridIdRef = useRef(0);
    const currentCards = CARD_SETS[gameSettings.cardSet].cards.slice(0, gameSettings.cardCount);

    // Initialize grid
    const createGrid = (): Card[][] => {
        const newGrid: Card[][] = [];
        const size = gameSettings.gridSize;

        for (let row = 0; row < size; row++) {
            newGrid[row] = [];
            for (let col = 0; col < size; col++) {
                let cardType;
                do {
                    cardType = currentCards[Math.floor(Math.random() * currentCards.length)];
                } while (
                    // Avoid creating initial matches
                (col >= 2 && newGrid[row][col-1]?.type === cardType && newGrid[row][col-2]?.type === cardType) ||
                (row >= 2 && newGrid[row-1]?.[col]?.type === cardType && newGrid[row-2]?.[col]?.type === cardType)
                    );

                newGrid[row][col] = {
                    type: cardType,
                    id: `${gridIdRef.current++}`,
                    row,
                    col,
                    isMatched: false,
                    isSelected: false
                };
            }
        }
        return newGrid;
    };

    // Initialize game
    useEffect(() => {
        resetGame();
    }, [gameSettings]);

    const resetGame = () => {
        setGrid(createGrid());
        setScore(0);
        setMoves(20);
        setLevel(1);
        setGameOver(false);
        setSelectedCards([]);
        setIsProcessing(false);
    };

    // Find matches (3 or more in a row/column)
    const findMatches = (currentGrid: Card[][]): Card[][] => {
        const newGrid = currentGrid.map(row =>
            row.map(card => ({ ...card, isMatched: false }))
        );
        let foundMatches = false;
        const size = gameSettings.gridSize;

        // Check horizontal matches
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size - 2; col++) {
                const current = newGrid[row][col];
                const next1 = newGrid[row][col + 1];
                const next2 = newGrid[row][col + 2];

                if (current.type === next1.type && current.type === next2.type) {
                    // Mark all connected pieces of same type
                    let endCol = col + 2;
                    while (endCol + 1 < size && newGrid[row][endCol + 1].type === current.type) {
                        endCol++;
                    }

                    for (let c = col; c <= endCol; c++) {
                        newGrid[row][c].isMatched = true;
                    }
                    foundMatches = true;
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < size; col++) {
            for (let row = 0; row < size - 2; row++) {
                const current = newGrid[row][col];
                const next1 = newGrid[row + 1][col];
                const next2 = newGrid[row + 2][col];

                if (current.type === next1.type && current.type === next2.type) {
                    // Mark all connected pieces of same type
                    let endRow = row + 2;
                    while (endRow + 1 < size && newGrid[endRow + 1][col].type === current.type) {
                        endRow++;
                    }

                    for (let r = row; r <= endRow; r++) {
                        newGrid[r][col].isMatched = true;
                    }
                    foundMatches = true;
                }
            }
        }

        return foundMatches ? newGrid : currentGrid;
    };

    // Remove matched cards and drop down
    const removeMatches = (currentGrid: Card[][]): Card[][] => {
        let newGrid = [...currentGrid];
        let matchCount = 0;
        const size = gameSettings.gridSize;

        // Count matches
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (newGrid[row][col].isMatched) {
                    matchCount++;
                }
            }
        }

        if (matchCount > 0) {
            setScore(prev => prev + matchCount * 15 * level);
        }

        // Drop cards down
        for (let col = 0; col < size; col++) {
            const column = [];
            for (let row = size - 1; row >= 0; row--) {
                if (!newGrid[row][col].isMatched) {
                    column.push(newGrid[row][col]);
                }
            }

            // Fill empty spaces with new cards
            while (column.length < size) {
                column.push({
                    type: currentCards[Math.floor(Math.random() * currentCards.length)],
                    id: `${gridIdRef.current++}`,
                    row: 0,
                    col,
                    isMatched: false,
                    isSelected: false
                });
            }

            // Update grid
            for (let row = 0; row < size; row++) {
                newGrid[row][col] = {
                    ...column[size - 1 - row],
                    row,
                    col,
                    isSelected: false
                };
            }
        }

        return newGrid;
    };

    // Process matches recursively
    const processMatches = async (currentGrid: Card[][]) => {
        const gridWithMatches = findMatches(currentGrid);
        const hasMatches = gridWithMatches.some(row =>
            row.some(card => card.isMatched)
        );

        if (hasMatches) {
            setTimeout(() => {
                const newGrid = removeMatches(gridWithMatches);
                setGrid(newGrid);
                setTimeout(() => processMatches(newGrid), 300);
            }, 200);
        } else {
            setIsProcessing(false);
        }
    };

    // Handle card selection and swapping
    const handleCardPress = (row: number, col: number) => {
        if (isProcessing || gameOver) return;

        const isAlreadySelected = selectedCards.some(
            selected => selected.row === row && selected.col === col
        );

        if (isAlreadySelected) {
            // Deselect
            setSelectedCards(prev =>
                prev.filter(selected => !(selected.row === row && selected.col === col))
            );
            updateGridSelection(row, col, false);
        } else if (selectedCards.length === 0) {
            // First selection
            setSelectedCards([{ row, col }]);
            updateGridSelection(row, col, true);
        } else if (selectedCards.length === 1) {
            const firstSelected = selectedCards[0];

            // Check if adjacent
            const isAdjacent = (
                (Math.abs(row - firstSelected.row) === 1 && col === firstSelected.col) ||
                (Math.abs(col - firstSelected.col) === 1 && row === firstSelected.row)
            );

            if (isAdjacent) {
                // Attempt swap
                attemptSwap(firstSelected, { row, col });
            } else {
                // Select new card
                updateGridSelection(firstSelected.row, firstSelected.col, false);
                setSelectedCards([{ row, col }]);
                updateGridSelection(row, col, true);
            }
        }
    };

    const updateGridSelection = (row: number, col: number, selected: boolean) => {
        setGrid(prev => {
            const newGrid = [...prev];
            newGrid[row][col] = { ...newGrid[row][col], isSelected: selected };
            return newGrid;
        });
    };

    const attemptSwap = (first: {row: number, col: number}, second: {row: number, col: number}) => {
        // Swap cards
        const newGrid = [...grid];
        const temp = newGrid[first.row][first.col];
        newGrid[first.row][first.col] = newGrid[second.row][second.col];
        newGrid[second.row][second.col] = temp;

        // Update positions
        newGrid[first.row][first.col].row = first.row;
        newGrid[first.row][first.col].col = first.col;
        newGrid[first.row][first.col].isSelected = false;
        newGrid[second.row][second.col].row = second.row;
        newGrid[second.row][second.col].col = second.col;
        newGrid[second.row][second.col].isSelected = false;

        // Check for matches
        const gridWithMatches = findMatches(newGrid);
        const hasMatches = gridWithMatches.some(row =>
            row.some(card => card.isMatched)
        );

        if (hasMatches) {
            setGrid(newGrid);
            setMoves(prev => prev - 1);
            setSelectedCards([]);
            setIsProcessing(true);
            processMatches(newGrid);
        } else {
            // Invalid move
            Alert.alert('Invalid Move', 'This swap doesn\'t create any matches!');
            setSelectedCards([]);
            updateGridSelection(first.row, first.col, false);
        }
    };

    // Check game over
    useEffect(() => {
        if (moves <= 0 && !isProcessing) {
            setGameOver(true);
        }
    }, [moves, isProcessing]);

    // Level up
    useEffect(() => {
        if (score >= level * 300) {
            setLevel(prev => prev + 1);
            setMoves(prev => prev + 3);
        }
    }, [score, level]);

    const renderCard = (card: Card, row: number, col: number) => {
        return (
            <TouchableOpacity
                key={card.id}
                style={[
                    styles.card,
                    card.isSelected && styles.selectedCard,
                    card.isMatched && styles.matchedCard
                ]}
                onPress={() => handleCardPress(row, col)}
                disabled={isProcessing}
            >
                <Text style={[styles.cardText, card.isMatched && styles.matchedText]}>
                    {card.type}
                </Text>
            </TouchableOpacity>
        );
    };

    const SettingsModal = () => (
        <View style={styles.settingsOverlay}>
            <View style={styles.settingsModal}>
                <Text style={styles.settingsTitle}>🎮 Game Settings</Text>

                <Text style={styles.settingLabel}>Card Theme:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
                    {Object.entries(CARD_SETS).map(([key, set]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.themeButton,
                                gameSettings.cardSet === key && styles.selectedTheme
                            ]}
                            onPress={() => setGameSettings(prev => ({ ...prev, cardSet: key as keyof typeof CARD_SETS }))}
                        >
                            <Text style={styles.themePreview}>{set.cards.slice(0, 3).join('')}</Text>
                            <Text style={styles.themeName}>{set.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.settingLabel}>Number of Card Types:</Text>
                <View style={styles.countButtons}>
                    {[3, 4, 5, 6, 7, 8].map(count => (
                        <TouchableOpacity
                            key={count}
                            style={[
                                styles.countButton,
                                gameSettings.cardCount === count && styles.selectedCount
                            ]}
                            onPress={() => setGameSettings(prev => ({ ...prev, cardCount: count }))}
                        >
                            <Text style={styles.countText}>{count}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.settingLabel}>Grid Size:</Text>
                <View style={styles.countButtons}>
                    {[6, 7, 8].map(size => (
                        <TouchableOpacity
                            key={size}
                            style={[
                                styles.countButton,
                                gameSettings.gridSize === size && styles.selectedCount
                            ]}
                            onPress={() => setGameSettings(prev => ({ ...prev, gridSize: size }))}
                        >
                            <Text style={styles.countText}>{size}x{size}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.settingsButtons}>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => {
                            setShowSettings(false);
                            resetGame();
                        }}
                    >
                        <Text style={styles.applyText}>✅ Apply & Start New Game</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowSettings(false)}
                    >
                        <Text style={styles.cancelText}>❌ Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const currentCellSize = Math.floor((width - 40) / gameSettings.gridSize);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.stats}>
                    <Text style={styles.statText}>Score: {score}</Text>
                    <Text style={styles.statText}>Level: {level}</Text>
                    <Text style={styles.statText}>Moves: {moves}</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
                    <Text style={styles.settingsButtonText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Current Theme Display */}
            <View style={styles.themeDisplay}>
                <Text style={styles.themeDisplayText}>
                    Theme: {CARD_SETS[gameSettings.cardSet].name} |
                    Types: {gameSettings.cardCount} |
                    Grid: {gameSettings.gridSize}x{gameSettings.gridSize}
                </Text>
                <View style={styles.cardPreview}>
                    {currentCards.map((card, index) => (
                        <Text key={index} style={styles.previewCard}>{card}</Text>
                    ))}
                </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    {selectedCards.length === 0 ? 'Select a card to start' :
                        selectedCards.length === 1 ? 'Select adjacent card to swap' : 'Processing...'}
                </Text>
            </View>

            {/* Game Grid */}
            <View style={styles.gameBoard}>
                {grid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((card, colIndex) => (
                            <TouchableOpacity
                                key={card.id}
                                style={[
                                    styles.card,
                                    { width: currentCellSize, height: currentCellSize },
                                    card.isSelected && styles.selectedCard,
                                    card.isMatched && styles.matchedCard
                                ]}
                                onPress={() => handleCardPress(rowIndex, colIndex)}
                                disabled={isProcessing}
                            >
                                <Text style={[
                                    styles.cardText,
                                    { fontSize: currentCellSize * 0.5 },
                                    card.isMatched && styles.matchedText
                                ]}>
                                    {card.type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                    <Text style={styles.resetText}>🔄 New Game</Text>
                </TouchableOpacity>
            </View>

            {/* Settings Modal */}
            {showSettings && <SettingsModal />}

            {/* Game Over Modal */}
            {gameOver && (
                <View style={styles.gameOverOverlay}>
                    <View style={styles.gameOverModal}>
                        <Text style={styles.gameOverTitle}>Game Over!</Text>
                        <Text style={styles.gameOverScore}>Final Score: {score}</Text>
                        <Text style={styles.gameOverLevel}>Level Reached: {level}</Text>
                        <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
                            <Text style={styles.restartText}>🔄 Play Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    stats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 15,
        borderRadius: 10,
    },
    statText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    settingsButton: {
        marginLeft: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButtonText: {
        fontSize: 20,
    },
    themeDisplay: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    themeDisplayText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 5,
    },
    cardPreview: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 8,
        borderRadius: 8,
    },
    previewCard: {
        fontSize: 16,
        marginHorizontal: 3,
    },
    instructions: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    instructionText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 10,
        borderRadius: 8,
    },
    gameBoard: {
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 8,
        borderRadius: 10,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        margin: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    matchedCard: {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderColor: '#ffd700',
    },
    cardText: {
        textAlign: 'center',
    },
    matchedText: {
        opacity: 0.6,
    },
    controls: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    resetText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Settings Modal Styles
    settingsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    settingsModal: {
        backgroundColor: '#1a1a2e',
        padding: 20,
        borderRadius: 15,
        width: width * 0.9,
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: '#00ff88',
    },
    settingsTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    settingLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    themeScroll: {
        marginBottom: 15,
    },
    themeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 10,
        marginRight: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 80,
    },
    selectedTheme: {
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
    },
    themePreview: {
        fontSize: 20,
        marginBottom: 5,
    },
    themeName: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    countButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    countButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCount: {
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
    },
    countText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    settingsButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    applyButton: {
        backgroundColor: '#00ff88',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 1,
        marginRight: 10,
    },
    applyText: {
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 1,
        marginLeft: 10,
    },
    cancelText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    // Game Over Modal
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    gameOverModal: {
        backgroundColor: '#1a1a2e',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00ff88',
    },
    gameOverTitle: {
        color: '#ff6b6b',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    gameOverScore: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    gameOverLevel: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 25,
    },
    restartButton: {
        backgroundColor: '#00ff88',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    restartText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
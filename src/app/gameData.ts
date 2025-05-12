export const positions = [
    { id: 0, x: 0, y: 0 }, // Top-left outer square
    { id: 1, x: 3, y: 0 }, // Top-middle outer square
    { id: 2, x: 6, y: 0 }, // Top-right outer square
    { id: 3, x: 6, y: 3 }, // Right-middle outer square
    { id: 4, x: 6, y: 6 }, // Bottom-right outer square
    { id: 5, x: 3, y: 6 }, // Bottom-middle outer square
    { id: 6, x: 0, y: 6 }, // Bottom-left outer square
    { id: 7, x: 0, y: 3 }, // Left-middle outer square
    { id: 8, x: 1, y: 1 }, // Top-left middle square
    { id: 9, x: 3, y: 1 }, // Top-middle middle square
    { id: 10, x: 5, y: 1 }, // Top-right middle square
    { id: 11, x: 5, y: 3 }, // Right-middle middle square
    { id: 12, x: 5, y: 5 }, // Bottom-right middle square
    { id: 13, x: 3, y: 5 }, // Bottom-middle middle square
    { id: 14, x: 1, y: 5 }, // Bottom-left middle square
    { id: 15, x: 1, y: 3 }, // Left-middle middle square
    { id: 16, x: 2, y: 2 }, // Top-left inner square
    { id: 17, x: 3, y: 2 }, // Top-middle inner square
    { id: 18, x: 4, y: 2 }, // Top-right inner square
    { id: 19, x: 4, y: 3 }, // Right-middle inner square
    { id: 20, x: 4, y: 4 }, // Bottom-right inner square
    { id: 21, x: 3, y: 4 }, // Bottom-middle inner square
    { id: 22, x: 2, y: 4 }, // Bottom-left inner square
    { id: 23, x: 2, y: 3 }, // Left-middle inner square
];

export const connections = [
    // Outer square
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    // Middle square
    [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
    // Inner square
    [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
    // Connections between squares
    [1, 9], [9, 17], [3, 11], [11, 19],
    [5, 13], [13, 21], [7, 15], [15, 23]
];

export const mills = [
    // Outer square mills
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    // Middle square mills
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    // Inner square mills
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],

    // Mills between squares
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

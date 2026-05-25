export type PaginationItem = number | 'ellipsis';

export const getPaginationItems = (page: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index
    );
  }

  const items = new Set([0, totalPages - 1, page - 1, page, page + 1]);

  if (page <= 2) {
    items.add(1);
    items.add(2);
    items.add(3);
  }

  if (page >= totalPages - 3) {
    items.add(totalPages - 2);
    items.add(totalPages - 3);
    items.add(totalPages - 4);
  }

  return [...items]
    .filter((item) => item >= 0 && item < totalPages)
    .sort((a, b) => a - b)
    .reduce<PaginationItem[]>((accumulator, item, index, array) => {
      const previousItem = array[index - 1];

      if (previousItem !== undefined && item - previousItem > 1) {
        accumulator.push('ellipsis');
      }

      accumulator.push(item);

      return accumulator;
    }, []);
};

export const formatAdminDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

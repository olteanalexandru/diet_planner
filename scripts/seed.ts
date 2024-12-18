const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

const USERS_TO_CREATE = 20;
const RECIPES_PER_USER = 5;
const COMMENTS_PER_RECIPE = 3;

const difficulties = ['easy', 'medium', 'hard'];
const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer'];
const cuisines = ['italian', 'mexican', 'chinese', 'indian', 'american', 'french', 'japanese'];
const dietaryPreferences = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'];
const specialties = ['baking', 'grilling', 'soup making', 'pastry', 'meal prep', 'healthy cooking'];

async function main() {
  console.log('Starting to seed database...');

  // Create users
  const users = [];
  for (let i = 0; i < USERS_TO_CREATE; i++) {
    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        bio: faker.lorem.paragraph(),
        location: faker.location.city(),
        website: faker.internet.url(),
        specialties: faker.helpers.arrayElements(specialties, { min: 1, max: 3 }),
        dietaryPreferences: faker.helpers.arrayElements(dietaryPreferences, { min: 0, max: 2 }),
        avatar: faker.image.avatar(),
      },
    });
    users.push(user);
    console.log(`Created user: ${user.name}`);
  }

  // Create recipes for each user
  for (const user of users) {
    for (let i = 0; i < RECIPES_PER_USER; i++) {
      const recipe = await prisma.recipe.create({
        data: {
          title: faker.helpers.arrayElement([
            'Homemade Pizza',
            'Chocolate Chip Cookies',
            'Chicken Curry',
            'Vegetable Stir Fry',
            'Pasta Carbonara',
            'Berry Smoothie Bowl',
            'Grilled Salmon',
            'Quinoa Salad',
          ]),
          description: faker.lorem.paragraph(),
          ingredients: Array.from({ length: faker.number.int({ min: 4, max: 10 }) }, () => 
            faker.helpers.arrayElement([
              '2 cups flour',
              '1 cup sugar',
              '3 eggs',
              '1 tsp vanilla extract',
              '2 tbsp olive oil',
              '1 cup milk',
              '500g chicken breast',
              '2 cloves garlic',
              '1 onion',
              'Salt and pepper to taste',
            ])
          ),
          instructions: Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () => 
            faker.lorem.sentence()
          ),
          cookingTime: faker.number.int({ min: 15, max: 120 }),
          servings: faker.number.int({ min: 2, max: 8 }),
          difficulty: faker.helpers.arrayElement(difficulties),
          category: faker.helpers.arrayElement(categories),
          cuisine: faker.helpers.arrayElement(cuisines),
          tags: faker.helpers.arrayElements(['healthy', 'quick', 'vegetarian', 'dessert', 'breakfast', 'dinner'], { min: 1, max: 4 }),
          dietaryInfo: {
            isVegetarian: faker.datatype.boolean(),
            isVegan: faker.datatype.boolean(),
            isGlutenFree: faker.datatype.boolean(),
          },
          prepTime: faker.number.int({ min: 10, max: 45 }),
          totalTime: faker.number.int({ min: 25, max: 165 }),
          calories: faker.number.int({ min: 200, max: 800 }),
          protein: faker.number.float({ min: 5, max: 40 }),
          carbs: faker.number.float({ min: 10, max: 100 }),
          fat: faker.number.float({ min: 5, max: 35 }),
          rating: Number(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 })),
          imageUrl: faker.image.url(),
          authorId: user.id,
        },
      });
      console.log(`Created recipe: ${recipe.title}`);

      // Add comments to recipe
      for (let j = 0; j < COMMENTS_PER_RECIPE; j++) {
        const commenter = faker.helpers.arrayElement(users);
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentences({ min: 1, max: 3 }),
            userId: commenter.id,
            recipeId: recipe.id,
          },
        });
      }

      // Add some likes
      const numberOfLikes = faker.number.int({ min: 0, max: 10 });
      for (let k = 0; k < numberOfLikes; k++) {
        const liker = faker.helpers.arrayElement(users);
        try {
          await prisma.recipeLike.create({
            data: {
              userId: liker.id,
              recipeId: recipe.id,
            },
          });
        } catch (error) {
          // Ignore duplicate likes
        }
      }
    }
  }

  // Create follows between users
  for (const user of users) {
    const numberOfFollows = faker.number.int({ min: 1, max: 10 });
    for (let i = 0; i < numberOfFollows; i++) {
      const userToFollow = faker.helpers.arrayElement(users.filter(u => u.id !== user.id));
      try {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingId: userToFollow.id,
          },
        });
      } catch (error) {
        // Ignore duplicate follows
      }
    }
  }

  // Create some activities
  for (const user of users) {
    const numberOfActivities = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < numberOfActivities; i++) {
      const recipe = await prisma.recipe.findFirst({
        where: { authorId: user.id },
      });
      if (recipe) {
        await prisma.activity.create({
          data: {
            type: faker.helpers.arrayElement(['RECIPE_CREATED', 'ACHIEVEMENT_UNLOCKED', 'MILESTONE_REACHED']),
            userId: user.id,
            recipeId: recipe.id,
            milestone: faker.helpers.arrayElement([10, 50, 100, 500, 1000]),
          },
        });
      }
    }
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
